import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../../services/firebase/config';
import redis from '../../../lib/redis';

// クライアントIP取得（Vercel環境対応）
function getClientIP(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = req.headers['x-real-ip'];
  if (realIP) {
    return realIP;
  }
  
  return req.socket?.remoteAddress || 'unknown';
}

// Origin/Referer検証（完全一致）
function validateOrigin(req) {
  const ALLOWED_ORIGINS = [
    'https://kawasaki-kyushoku.jp',
    'https://kawasaki-lunch.vercel.app', 
    'https://www.kawasaki-lunch.com',
    'https://kawasaki-lunch.com',
    'http://localhost:3000'
  ];
  
  // Origin優先チェック
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return { valid: true, origin };
  }
  
  // Referer fallback（完全一致）
  const referer = req.headers.referer || req.headers.referrer;
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (ALLOWED_ORIGINS.includes(refererOrigin)) {
        return { valid: true, origin: refererOrigin };
      }
    } catch (e) {
      // Invalid URL
    }
  }
  
  return { valid: false, origin: origin || referer || 'unknown' };
}

// 分散レート制限（Upstash Redis）- 月間データは重いので制限を厳しく
async function checkRateLimit(req) {
  const clientIP = getClientIP(req);
  const { origin } = validateOrigin(req);
  const path = req.url || '/api/menu/monthly';
  
  const key = `rate_limit:${clientIP}:${origin}:${path}`;
  const window = 60; // 1分間
  const limit = 5;   // 5リクエスト（月間データは重いため）
  
  try {
    // Redis pipeline for atomic operations
    const pipeline = redis.pipeline();
    pipeline.incr(key);
    pipeline.expire(key, window);
    const results = await pipeline.exec();
    
    const count = results[0][1]; // [error, result] の result部分
    
    if (count > limit) {
      return { 
        allowed: false, 
        count, 
        remaining: 0,
        resetTime: Math.ceil(Date.now() / 1000) + window
      };
    }
    
    return { 
      allowed: true, 
      count, 
      remaining: limit - count,
      resetTime: Math.ceil(Date.now() / 1000) + window
    };
    
  } catch (error) {
    console.error('Redis rate limit error:', error);
    // フォールバック: Redis障害時はリクエストを通す
    return { allowed: true, count: 0, remaining: limit, resetTime: 0 };
  }
}

// 入力値検証（Zodスキーマ風）
function validateMonthlyInput(query) {
  const { 
    year = new Date().getFullYear(), 
    month = new Date().getMonth() + 1, 
    district = 'A' 
  } = query;

  // 年の検証
  const yearNum = parseInt(year);
  if (isNaN(yearNum) || yearNum < 2024 || yearNum > 2030) {
    throw new Error('年は2024年から2030年の間で指定してください');
  }

  // 月の検証
  const monthNum = parseInt(month);
  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    throw new Error('月は1から12の間で指定してください');
  }

  // 地区の検証
  const allowedDistricts = ['A', 'B', 'C', '北部', '中部', '南部'];
  if (!allowedDistricts.includes(district)) {
    throw new Error('地区は A, B, C, 北部, 中部, 南部 のいずれかを指定してください');
  }

  // 未来日付の制限（運用上の考慮）
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  if (yearNum > currentYear || (yearNum === currentYear && monthNum > currentMonth + 2)) {
    throw new Error('2ヶ月以降の未来のデータは取得できません');
  }

  // 未知のクエリパラメータをフィルタリング
  const validParams = { year: yearNum, month: monthNum, district };
  const unknownParams = Object.keys(query).filter(key => !['year', 'month', 'district'].includes(key));
  
  if (unknownParams.length > 0) {
    console.warn('Unknown query parameters ignored:', unknownParams);
  }

  return validParams;
}

// キャッシュヘッダ設定（月間データは長期キャッシュ）
function setCacheHeaders(res) {
  // 24時間キャッシュ、stale-while-revalidateで10分間
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=600');
  res.setHeader('Vary', 'Origin');
}

// CORS設定
function setCORSHeaders(res, origin) {
  const ALLOWED_ORIGINS = [
    'https://kawasaki-kyushoku.jp',
    'https://kawasaki-lunch.vercel.app',
    'https://www.kawasaki-lunch.com', 
    'https://kawasaki-lunch.com',
    'http://localhost:3000'
  ];
  
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Vary', 'Origin');
  }
}

// セキュリティログ
function logSecurityEvent(event, req, details = {}) {
  const clientIP = getClientIP(req);
  const { origin } = validateOrigin(req);
  
  console.warn(`Security event: ${event}`, {
    ip: clientIP?.substring(0, 12) + '***', // IP部分マスク
    origin,
    path: req.url,
    userAgent: req.headers['user-agent']?.substring(0, 50),
    timestamp: new Date().toISOString(),
    ...details
  });
}

// データサニタイゼーション
function sanitizeMenuData(doc) {
  const data = doc.data();
  
  return {
    id: doc.id,
    date: data.date,
    dayOfWeek: data.dayOfWeek,
    district: data.district,
    menu: data.menu,
    nutrition: data.nutrition,
    hasSpecialMenu: data.hasSpecialMenu,
    notes: data.notes,
    year: data.year,
    month: data.month
  };
}

export default async function handler(req, res) {
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // 1. HTTPメソッド制限
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ 
        error: 'Method not allowed',
        allowed: ['GET'],
        metadata: { requestId, timestamp: new Date().toISOString() }
      });
    }

    // 2. レート制限チェック（月間データは5回/分の制限）
    const rateLimitResult = await checkRateLimit(req);
    
    if (!rateLimitResult.allowed) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', req, {
        count: rateLimitResult.count,
        limit: 5,
        endpoint: 'monthly'
      });
      
      // Rate limiting headers
      res.setHeader('X-RateLimit-Limit', '5');
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', rateLimitResult.resetTime);
      res.setHeader('Retry-After', '60');
      
      return res.status(429).json({
        error: 'Too many requests',
        message: '月間データは1分間に5回までのリクエストに制限されています',
        retryAfter: 60,
        metadata: { requestId, timestamp: new Date().toISOString() }
      });
    }
    
    // Rate limiting headers（成功時）
    res.setHeader('X-RateLimit-Limit', '5');
    res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    res.setHeader('X-RateLimit-Reset', rateLimitResult.resetTime.toString());

    // 3. Origin/Referer検証（本番環境のみ）
    if (process.env.NODE_ENV === 'production') {
      const originCheck = validateOrigin(req);
      
      if (!originCheck.valid) {
        logSecurityEvent('INVALID_ORIGIN', req, {
          providedOrigin: originCheck.origin,
          endpoint: 'monthly'
        });
        
        return res.status(403).json({ 
          error: 'Forbidden',
          message: 'Invalid origin',
          metadata: { requestId, timestamp: new Date().toISOString() }
        });
      }
      
      // CORS設定
      setCORSHeaders(res, originCheck.origin);
    }

    // 4. 入力値検証
    let validatedInput;
    try {
      validatedInput = validateMonthlyInput(req.query);
    } catch (validationError) {
      return res.status(400).json({
        error: 'Invalid input',
        message: validationError.message,
        validParams: {
          year: '2024-2030の整数',
          month: '1-12の整数',
          district: ['A', 'B', 'C', '北部', '中部', '南部']
        },
        metadata: { requestId, timestamp: new Date().toISOString() }
      });
    }

    // 5. キャッシュヘッダ設定
    setCacheHeaders(res);

    // 6. データ取得処理
    const { year, month, district } = validatedInput;
    
    const menusRef = collection(db, 'kawasaki_menus');
    const q = query(
      menusRef,
      where('year', '==', year),
      where('month', '==', month),
      where('district', '==', district),
      orderBy('date', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    
    // 7. データサニタイゼーション
    const menus = querySnapshot.docs.map(sanitizeMenuData);

    // 8. データサイズ制限とパフォーマンス保護
    const maxResults = 50; // 最大50件まで
    const limitedMenus = menus.slice(0, maxResults);
    
    if (menus.length > maxResults) {
      console.warn(`Large dataset detected: ${menus.length} items, limited to ${maxResults}`, {
        year, month, district, requestId
      });
      
      // 大量データ検出時のログ
      logSecurityEvent('LARGE_DATASET_REQUEST', req, {
        totalCount: menus.length,
        limitedTo: maxResults,
        year, month, district
      });
    }

    // 9. 統計情報の計算
    const statistics = {
      totalDays: limitedMenus.length,
      specialMenuDays: limitedMenus.filter(menu => menu.hasSpecialMenu).length,
      averageCalories: limitedMenus.length > 0 
        ? Math.round(
            limitedMenus
              .filter(menu => menu.nutrition?.energy)
              .reduce((sum, menu) => sum + menu.nutrition.energy, 0) / 
            limitedMenus.filter(menu => menu.nutrition?.energy).length
          )
        : 0
    };

    // 10. レスポンス返却
    return res.status(200).json({
      success: true,
      data: limitedMenus,
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        query: { year, month, district },
        count: limitedMenus.length,
        totalCount: menus.length,
        limited: menus.length > maxResults,
        statistics,
        rateLimit: {
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime
        }
      }
    });

  } catch (error) {
    // 11. エラーハンドリング
    console.error('Monthly API Error:', error, { requestId });
    
    // セキュリティログ
    logSecurityEvent('API_ERROR', req, {
      errorType: error.constructor.name,
      errorMessage: process.env.NODE_ENV === 'production' ? '[REDACTED]' : error.message,
      endpoint: 'monthly',
      requestId
    });
    
    const errorResponse = {
      success: false,
      error: 'Internal server error',
      metadata: {
        requestId,
        timestamp: new Date().toISOString()
      }
    };
    
    // 開発環境では詳細エラー情報を含める
    if (process.env.NODE_ENV !== 'production') {
      errorResponse.debug = {
        message: error.message,
        stack: error.stack
      };
    }
    
    // Firestoreエラーの特別処理
    if (error.code && error.code.startsWith('firestore/')) {
      errorResponse.error = 'Database error';
      if (process.env.NODE_ENV !== 'production') {
        errorResponse.debug.firestoreCode = error.code;
      }
    }
    
    return res.status(500).json(errorResponse);
  }
}