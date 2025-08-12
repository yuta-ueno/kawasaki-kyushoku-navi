// lib/rate-limit.js
import redis from './redis.js'

export async function rateLimit(req) {
  const ip = getClientIP(req)
  const origin = req.headers.origin || req.headers.referer || 'unknown'
  const path = req.url || 'unknown'
  
  const key = `rate_limit:${ip}:${origin}:${path}`
  const window = 60 // 1分間
  const limit = 10  // 10リクエスト
  
  try {
    // カウンターを増加
    const count = await redis.incr(key)
    
    // 初回の場合、TTLを設定
    if (count === 1) {
      await redis.expire(key, window)
    }
    
    // 制限チェック
    if (count > limit) {
      throw new Error('Rate limit exceeded')
    }
    
    return { success: true, count, remaining: limit - count }
  } catch (error) {
    console.error('Rate limit error:', error)
    // Redis接続エラーの場合はスルー（フォールバック）
    return { success: true, count: 0, remaining: limit }
  }
}

function getClientIP(req) {
  const forwarded = req.headers['x-forwarded-for']
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown'
}