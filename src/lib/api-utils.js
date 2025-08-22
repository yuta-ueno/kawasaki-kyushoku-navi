// lib/api-utils.js - 統一APIユーティリティ関数

import { 
  RateLimitError, 
  ValidationError, 
  OriginError, 
  ApiError,
  isCustomError,
  getErrorStatusCode 
} from './errors.js'
import { captureAPIError, captureSecurityEvent } from './sentry'

// 統一エラーハンドリング関数
export function handleApiError(error, res, requestId = 'unknown') {
  const timestamp = new Date().toISOString()
  
  // 構造化ログ出力
  console.error(`[API Error] ${error.name}: ${error.message}`, {
    timestamp,
    requestId,
    errorType: error.constructor.name,
    stack: error.stack,
    details: error.details || {}
  })

  // Sentryにエラー送信
  captureAPIError(error, {
    requestId,
    endpoint: res.locals?.endpoint || 'unknown',
    timestamp,
    errorType: error.constructor.name
  })

  // カスタムエラーの処理
  if (error instanceof RateLimitError) {
    // レート制限ヘッダーを設定
    const headers = error.getHeaders()
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value)
    })

    // セキュリティログ
    captureSecurityEvent('RATE_LIMIT_EXCEEDED', {
      requestId,
      count: error.count,
      limit: error.limit,
      endpoint: res.locals?.endpoint || 'unknown'
    })

    return res.status(429).json({
      ...error.toResponse(),
      metadata: {
        requestId,
        timestamp
      }
    })
  }

  if (error instanceof ValidationError) {
    // セキュリティログ
    captureSecurityEvent('VALIDATION_FAILED', {
      requestId,
      errors: error.errors,
      endpoint: res.locals?.endpoint || 'unknown'
    })

    return res.status(400).json({
      ...error.toResponse(),
      metadata: {
        requestId,
        timestamp
      }
    })
  }

  if (error instanceof OriginError) {
    // セキュリティログ
    captureSecurityEvent('INVALID_ORIGIN', {
      requestId,
      providedOrigin: error.providedOrigin,
      endpoint: res.locals?.endpoint || 'unknown'
    })

    return res.status(403).json({
      ...error.toResponse(),
      metadata: {
        requestId,
        timestamp
      }
    })
  }

  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      ...error.toResponse(),
      metadata: {
        requestId,
        timestamp
      }
    })
  }

  // その他のエラー（予期しないエラー）
  const errorResponse = {
    error: 'Internal server error',
    message: 'An unexpected error occurred',
    metadata: {
      requestId,
      timestamp
    }
  }

  // 開発環境では詳細情報を含める
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.debug = {
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n'),
      type: error.constructor.name
    }
  }

  return res.status(500).json(errorResponse)
}

// レート制限チェック結果をRateLimitErrorに変換
export function checkRateLimitResult(rateLimitResult, limit = 10, window = 60) {
  if (!rateLimitResult.allowed) {
    throw new RateLimitError(
      rateLimitResult.count,
      limit,
      rateLimitResult.resetTime,
      window
    )
  }
  return rateLimitResult
}

// オリジン検証結果をOriginErrorに変換
export function validateOriginResult(originCheck, allowedOrigins = []) {
  if (!originCheck.valid) {
    throw new OriginError(originCheck.origin, allowedOrigins)
  }
  return originCheck
}

// バリデーション結果をValidationErrorに変換
export function validateInputResult(validationResult) {
  if (!validationResult.success) {
    throw new ValidationError(validationResult.errors)
  }
  return validationResult.data
}

// 共通レスポンスヘッダー設定
export function setCommonHeaders(res, options = {}) {
  const {
    cacheMaxAge = 3600,
    staleWhileRevalidate = 600,
    allowedOrigin = null,
    endpoint = 'unknown'
  } = options

  // キャッシュヘッダー
  res.setHeader(
    'Cache-Control',
    `public, s-maxage=${cacheMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`
  )
  
  // CORS
  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
    res.setHeader('Access-Control-Allow-Methods', 'GET')
  }
  
  res.setHeader('Vary', 'Origin')
  
  // セキュリティヘッダー
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  
  // エンドポイント情報をres.localsに保存（エラーハンドリング用）
  res.locals = res.locals || {}
  res.locals.endpoint = endpoint
}

// 成功レスポンスのフォーマット
export function formatSuccessResponse(data, metadata = {}) {
  return {
    success: true,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata
    }
  }
}

// クライアントIP取得（Vercel環境対応）
export function getClientIP(req) {
  const forwarded = req.headers['x-forwarded-for']
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIP = req.headers['x-real-ip']
  if (realIP) {
    return realIP
  }

  return req.socket?.remoteAddress || 'unknown'
}

// リクエストID生成
export function generateRequestId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}