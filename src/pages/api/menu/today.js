import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase/config';
import redis, { rateLimitIncrement } from '../../../lib/redis';
import { validateInput, todaySchema, formatValidationErrors, getTodayJST } from '../../../lib/validation';

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

// 分散レート制限（Upstash Redis）
async function checkRateLimit(req) {
  const clientIP = getClientIP(req);
  const { origin } = validateOrigin(req);
  const path = req.url || '/api/menu/today';
  
  const key = `rate_limit:${clientIP}:${origin}:${path}`;
  const window = 60; // 1分間
  const limit = 10;  // 10リクエスト
  
  try {
    // Redis pipeline for atomic operations
    const pipeline = redis.pipeline();
    pipeline.incr(key);
    pipeline.expire(key, window);
    const results = await pipeline.exec();
    
    const count = await rateLimitIncrement(key, window);
    
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

// キャッシュヘッダ設定
function setCacheHeaders(res) {
  // 5分間キャッシュ、stale-while-revalidateで1分間
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
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

    // 2. レート制限チェック
    const rateLimitResult = await checkRateLimit(req);
    
    if (!rateLimitResult.allowed) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', req, {
        count: rateLimitResult.count,
        limit: 10,
        requestId
      });
      
      // Rate limiting headers
      res.setHeader('X-RateLimit-Limit', '10');
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', rateLimitResult.resetTime);
      res.setHeader('Retry-After', '60');
      
      return res.status(429).json({
        error: 'Too many requests',
        message: '1分間に10回までのリクエストに制限されています',
        retryAfter: 60,
        metadata: { requestId, timestamp: new Date().toISOString() }
      });
    }
    
    // Rate limiting headers（成功時）
    res.setHeader('X-RateLimit-Limit', '10');
    res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    res.setHeader('X-RateLimit-Reset', rateLimitResult.resetTime.toString());

    // 3. Origin/Referer検証（本番環境のみ）
    if (process.env.NODE_ENV === 'production') {
      const originCheck = validateOrigin(req);
      
      if (!originCheck.valid) {
        logSecurityEvent('INVALID_ORIGIN', req, {
          providedOrigin: originCheck.origin,
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
    const validationResult = validateInput(todaySchema, req.query, {
      stripUnknown: true,
      allowPartial: false
    });
    
    if (!validationResult.success) {
      logSecurityEvent('VALIDATION_FAILED', req, {
        errors: validationResult.errors,
        providedQuery: Object.keys(req.query),
        requestId
      });
      
      return res.status(400).json({
        ...formatValidationErrors(validationResult.errors),
        metadata: { requestId, timestamp: new Date().toISOString() }
      });
    }

    // バリデーション済みデータの取得
    const { date = getTodayJST(), district } = validationResult.data;

    // 5. キャッシュヘッダ設定
    setCacheHeaders(res);

    // 6. データ取得処理
    const docId = `${date}-${district}`;
    
    const docRef = doc(db, 'kawasaki_menus', docId);
    const docSnap = await getDoc(docRef);

    // 7. レスポンス返却
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // セキュリティ: 不要なメタデータを除去
      const sanitizedData = {
        date: data.date,
        dayOfWeek: data.dayOfWeek,
        district: data.district,
        menu: data.menu,
        nutrition: data.nutrition,
        hasSpecialMenu: data.hasSpecialMenu,
        notes: data.notes
      };
      
      return res.status(200).json({
        success: true,
        data: sanitizedData,
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          query: { date, district },
          rateLimit: {
            remaining: rateLimitResult.remaining,
            resetTime: rateLimitResult.resetTime
          },
          validation: {
            schema: 'todaySchema',
            processedFields: Object.keys(validationResult.data)
          }
        }
      });
    } else {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: `指定された日付(${date})・地区(${district})の給食データが見つかりません`,
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          query: { date, district }
        }
      });
    }

  } catch (error) {
    // 8. エラーハンドリング
    console.error('Today API Error:', error, { requestId });
    
    // セキュリティログ
    logSecurityEvent('API_ERROR', req, {
      errorType: error.constructor.name,
      errorMessage: process.env.NODE_ENV === 'production' ? '[REDACTED]' : error.message,
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
    
    return res.status(500).json(errorResponse);
  }
}