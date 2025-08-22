// lib/errors.js - カスタムエラークラス定義

export class RateLimitError extends Error {
  constructor(count, limit, resetTime, window = 60) {
    super('Rate limit exceeded')
    this.name = 'RateLimitError'
    this.count = count
    this.limit = limit
    this.resetTime = resetTime
    this.window = window
    this.retryAfter = Math.max(1, Math.ceil((resetTime * 1000 - Date.now()) / 1000))
  }

  toResponse() {
    return {
      error: 'Rate limit exceeded',
      message: `Too many requests. Limit: ${this.limit} per ${this.window}s`,
      retryAfter: this.retryAfter,
      resetTime: new Date(this.resetTime * 1000).toISOString(),
      details: {
        current: this.count,
        limit: this.limit,
        window: this.window
      }
    }
  }

  getHeaders() {
    return {
      'Retry-After': this.retryAfter.toString(),
      'X-RateLimit-Limit': this.limit.toString(),
      'X-RateLimit-Remaining': Math.max(0, this.limit - this.count).toString(),
      'X-RateLimit-Reset': this.resetTime.toString()
    }
  }
}

export class ValidationError extends Error {
  constructor(errors, message = 'Validation failed') {
    super(message)
    this.name = 'ValidationError'
    this.errors = errors
  }

  toResponse() {
    return {
      error: 'Validation failed',
      message: 'Invalid input parameters',
      details: this.errors
    }
  }
}

export class OriginError extends Error {
  constructor(providedOrigin, allowedOrigins) {
    super('Invalid origin')
    this.name = 'OriginError'
    this.providedOrigin = providedOrigin
    this.allowedOrigins = allowedOrigins
  }

  toResponse() {
    return {
      error: 'Forbidden',
      message: 'Invalid origin',
      details: {
        provided: this.providedOrigin,
        // 本番環境では許可されたオリジンのリストは返さない
        allowedOriginsCount: this.allowedOrigins?.length || 0
      }
    }
  }
}

export class ApiError extends Error {
  constructor(message, statusCode = 500, details = {}) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.details = details
  }

  toResponse() {
    return {
      error: this.message,
      message: 'An API error occurred',
      details: this.details
    }
  }
}

// エラータイプの判定ヘルパー
export function isCustomError(error) {
  return error instanceof RateLimitError ||
         error instanceof ValidationError ||
         error instanceof OriginError ||
         error instanceof ApiError
}

// エラーのHTTPステータスコードを取得
export function getErrorStatusCode(error) {
  if (error instanceof RateLimitError) return 429
  if (error instanceof ValidationError) return 400
  if (error instanceof OriginError) return 403
  if (error instanceof ApiError) return error.statusCode
  return 500
}