import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../../services/firebase/config';
import redis, { rateLimitIncrement } from '../../../lib/redis';  // 👈 rateLimitIncrement を追加
import { validateInput, monthlySchema, formatValidationErrors } from '../../../lib/validation';

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

// 分散レート制限（Upstash Redis）- デバッグ版
async function checkRateLimit(req) {
  const clientIP = getClientIP(req);
  const { origin } = validateOrigin(req);
  const path = req.url || '/api/menu/monthly';
  
  const key = `rate_limit:${clientIP}:${origin}:${path}`;
  const window = 60; // 1分間
  const limit = 5;   // 5リクエスト（月間データは重いため）
  
  console.log('=== Rate Limit Check Debug ===');
  console.log('Client IP:', clientIP);
  console.log('Origin:', origin);
  console.log('Path:', path);
  console.log('Redis Key:', key);
  console.log('Limit:', limit);
  console.log('Window:', window);
  
  try {
    // rateLimitIncrementを使用
    const count = await rateLimitIncrement(key, window);
    
    console.log('Rate limit count result:', count);
    console.log('Count type:', typeof count);
    console.log('Is count valid number?', !isNaN(count) && count > 0);
    
    if (isNaN(count)) {
      console.error('Count is NaN - falling back');
      return { allowed: true, count: 0, remaining: limit, resetTime: 0 };
    }
    
    const remaining = Math.max(0, limit - count);
    const resetTime = Math.ceil(Date.now() / 1000) + window;
    
    console.log('Calculated remaining:', remaining);
    console.log('Reset time:', resetTime);
    
    if (count > limit) {
      console.log('Rate limit exceeded!');
      return { 
        allowed: false, 
        count, 
        remaining: 0,
        resetTime
      };
    }
    
    console.log('Rate limit OK');
    return { 
      allowed: true, 
      count, 
      remaining,
      resetTime
    };
    
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // フォールバック: Redis障害時はリクエストを通す
    return { allowed: true, count: 0, remaining: limit, resetTime: 0 };
  }
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
        endpoint: 'monthly',
        requestId
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
          endpoint: 'monthly',
          requestId
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

    // 4. 入力値検証（Zod使用）
    const validationResult = validateInput(monthlySchema, req.query, {
      stripUnknown: true,
      allowPartial: false
    });
    
    if (!validationResult.success) {
      logSecurityEvent('VALIDATION_FAILED', req, {
        errors: validationResult.errors,
        providedQuery: Object.keys(req.query),
        endpoint: 'monthly',
        requestId
      });
      
      return res.status(400).json({
        ...formatValidationErrors(validationResult.errors),
        metadata: { requestId, timestamp: new Date().toISOString() }
      });
    }

    // バリデーション済みデータの取得
    const { year, month, district } = validationResult.data;

    // 5. キャッシュヘッダ設定
    setCacheHeaders(res);

    // 6. データ取得処理
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
        year, month, district,
        requestId
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
        : 0,
      dateRange: limitedMenus.length > 0 ? {
        start: limitedMenus[0]?.date,
        end: limitedMenus[limitedMenus.length - 1]?.date
      } : null
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
        },
        validation: {
          schema: 'monthlySchema',
          processedFields: Object.keys(validationResult.data)
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
        stack: error.stack?.split('\n').slice(0, 5).join('\n') // スタックトレースを5行に制限
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