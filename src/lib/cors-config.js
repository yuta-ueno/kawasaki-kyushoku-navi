// lib/cors-config.js - CORS設定の統一管理

import { getClientIP } from './api-utils'

// 許可されたオリジンの管理
const ALLOWED_ORIGINS = {
  production: [
    'https://www.kawasaki-kyushoku.jp',
    'https://kawasaki-kyushoku.jp',
    // Vercel deployment domains
    'https://kawasaki-kyushoku-navi-anucrj3xh-yutas-projects-fc6b6de6.vercel.app',
    'https://kawasaki-kyushoku-navi-cqh948chk-yutas-projects-fc6b6de6.vercel.app',
    // Vercel domain pattern
    'https://kawasaki-kyushoku-navi*.vercel.app',
    // 将来追加予定
    // 'https://www.city.kawasaki.jp',
    // 'https://city.kawasaki.jp'
  ],
  development: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
  ]
}

// ドメイン別設定（将来の拡張準備）
const DOMAIN_CONFIGS = {
  // 本番ドメイン設定
  'kawasaki-kyushoku.jp': {
    allowedMethods: ['GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Origin', 'Accept', 'X-Requested-With'],
    maxAge: 86400, // 24時間
    credentials: false
  },
  // 将来の川崎市公式ドメイン用
  'city.kawasaki.jp': {
    allowedMethods: ['GET', 'OPTIONS', 'POST'], // 将来的にPOSTも許可予定
    allowedHeaders: ['Content-Type', 'Origin', 'Accept', 'X-Requested-With', 'X-Kawasaki-Auth'], // 公式認証ヘッダ用
    maxAge: 3600, // 1時間（公式ドメインは短めに設定）
    credentials: true, // 公式ドメインでは認証情報を許可
    specialHeaders: ['X-Kawasaki-Auth']
  },
  // ローカル開発用
  'localhost': {
    allowedMethods: ['GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Origin', 'Accept', 'X-Requested-With'],
    maxAge: 0, // 開発時はキャッシュなし
    credentials: false
  }
}

/**
 * 環境に応じた許可オリジンを取得
 * @returns {string[]} 許可されたオリジンの配列
 */
export function getAllowedOrigins() {
  const production = ALLOWED_ORIGINS.production
  const development = ALLOWED_ORIGINS.development
  
  if (process.env.NODE_ENV === 'production') {
    return production
  }
  
  // 開発環境では本番オリジンも含める（テスト用）
  return [...production, ...development]
}

/**
 * オリジンが許可されているかチェック
 * @param {string} origin - チェックするオリジン
 * @returns {boolean} 許可されているかどうか
 */
export function isOriginAllowed(origin) {
  if (!origin) return false
  
  const allowedOrigins = getAllowedOrigins()
  
  // 完全一致チェック
  if (allowedOrigins.includes(origin)) {
    return true
  }
  
  // プロトコル違いをチェック（http/https）
  for (const allowed of allowedOrigins) {
    if (origin === allowed || 
        origin === allowed.replace('https://', 'http://') || 
        origin === allowed.replace('http://', 'https://')) {
      return true
    }
  }
  
  // Vercelドメインのワイルドカードマッチング
  if (origin.includes('vercel.app')) {
    const vercelPattern = /https:\/\/kawasaki-kyushoku-navi.*\.vercel\.app$/
    if (vercelPattern.test(origin)) {
      return true
    }
  }
  
  // 本番環境では厳格に管理された本番ドメインのみ許可
  
  return false
}

/**
 * オリジンからドメイン設定を取得
 * @param {string} origin - オリジン
 * @returns {object} ドメイン設定
 */
export function getDomainConfig(origin) {
  if (!origin) {
    return DOMAIN_CONFIGS['localhost']
  }
  
  // ドメイン部分を抽出
  try {
    const url = new URL(origin)
    const hostname = url.hostname
    
    for (const [domain, config] of Object.entries(DOMAIN_CONFIGS)) {
      if (hostname.includes(domain) || hostname === domain) {
        return config
      }
    }
  } catch (e) {
    // Invalid URL
  }
  
  // デフォルト設定を返す
  return DOMAIN_CONFIGS['kawasaki-kyushoku.jp']
}

/**
 * CORSヘッダを設定
 * @param {object} req - リクエストオブジェクト
 * @param {object} res - レスポンスオブジェクト
 * @param {object} options - オプション設定
 */
export function setCorsHeaders(req, res, options = {}) {
  const origin = req.headers.origin
  const referer = req.headers.referer || req.headers.referrer
  const requestOrigin = origin || (referer ? new URL(referer).origin : null)
  
  const domainConfig = getDomainConfig(requestOrigin)
  const isAllowed = isOriginAllowed(requestOrigin)
  
  // Origin ヘッダ設定
  if (isAllowed && requestOrigin) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin)
  } else {
    // 許可されていない場合はデフォルトまたはnullを設定
    const fallbackOrigin = process.env.NODE_ENV === 'production' 
      ? getAllowedOrigins()[0] 
      : requestOrigin || getAllowedOrigins()[0]
    res.setHeader('Access-Control-Allow-Origin', fallbackOrigin)
  }
  
  // メソッド設定
  const allowedMethods = options.methods || domainConfig.allowedMethods
  res.setHeader('Access-Control-Allow-Methods', allowedMethods.join(', '))
  
  // ヘッダ設定
  const allowedHeaders = options.headers || domainConfig.allowedHeaders
  res.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(', '))
  
  // キャッシュ設定
  const maxAge = options.maxAge !== undefined ? options.maxAge : domainConfig.maxAge
  res.setHeader('Access-Control-Max-Age', maxAge.toString())
  
  // 認証情報設定
  if (domainConfig.credentials) {
    res.setHeader('Access-Control-Allow-Credentials', 'true')
  }
  
  // Vary ヘッダ
  res.setHeader('Vary', 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers')
  
  // セキュリティヘッダ（既存の api-utils と重複しないよう調整）
  if (!res.getHeader('X-Content-Type-Options')) {
    res.setHeader('X-Content-Type-Options', 'nosniff')
  }
  
  return { isAllowed, origin: requestOrigin, config: domainConfig }
}

/**
 * プリフライトリクエスト（OPTIONS）を処理
 * @param {object} req - リクエストオブジェクト
 * @param {object} res - レスポンスオブジェクト
 */
export function handlePreflightRequest(req, res) {
  const corsResult = setCorsHeaders(req, res)
  
  // プリフライトリクエストのログ
  logCorsAccess(req, corsResult.origin, corsResult.isAllowed, 'PREFLIGHT')
  
  // プリフライトリクエストの成功レスポンス
  res.status(200).end()
}

/**
 * CORS関連のアクセスログを記録
 * @param {object} req - リクエストオブジェクト
 * @param {string} origin - オリジン
 * @param {boolean} allowed - 許可されているか
 * @param {string} type - アクセスタイプ
 */
export function logCorsAccess(req, origin, allowed, type = 'REQUEST') {
  const clientIP = getClientIP(req)
  const maskedIP = clientIP ? clientIP.substring(0, clientIP.lastIndexOf('.')) + '.***' : 'unknown'
  
  const logData = {
    timestamp: new Date().toISOString(),
    type,
    ip: maskedIP,
    origin: origin || 'none',
    allowed,
    method: req.method,
    path: req.url,
    userAgent: req.headers['user-agent']?.substring(0, 50) || 'unknown',
    referer: req.headers.referer?.substring(0, 50) || 'none'
  }
  
  if (allowed) {
    console.log('[CORS-OK]', logData)
  } else {
    console.warn('[CORS-DENY]', logData)
  }
}

/**
 * Origin検証とエラーレスポンス生成
 * @param {object} req - リクエストオブジェクト
 * @param {object} res - レスポンスオブジェクト
 * @returns {object} 検証結果
 */
export function validateOriginForApi(req, res) {
  const origin = req.headers.origin
  const referer = req.headers.referer || req.headers.referrer
  const requestOrigin = origin || (referer ? new URL(referer).origin : null)
  
  const isAllowed = isOriginAllowed(requestOrigin)
  
  // 本番環境でのみ厳格にチェック
  if (process.env.NODE_ENV === 'production' && !isAllowed) {
    logCorsAccess(req, requestOrigin, false, 'BLOCKED')
    
    return {
      valid: false,
      origin: requestOrigin,
      error: {
        status: 403,
        response: {
          error: 'Forbidden',
          message: 'Origin not allowed',
          metadata: {
            timestamp: new Date().toISOString(),
            requestId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          }
        }
      }
    }
  }
  
  // CORS ヘッダを設定
  setCorsHeaders(req, res)
  logCorsAccess(req, requestOrigin, true)
  
  return {
    valid: true,
    origin: requestOrigin,
    isAllowed
  }
}

/**
 * 将来の拡張用：新しいドメインを動的に追加
 * @param {string} domain - 追加するドメイン
 * @param {object} config - ドメイン設定
 */
export function addAllowedDomain(domain, config = {}) {
  // 実装は将来の要件に応じて
  console.log(`[CORS] Domain addition requested: ${domain}`, config)
  // TODO: 動的ドメイン追加機能（管理者権限要求）
}

// デバッグ用：現在の設定を表示
export function debugCorsConfig() {
  if (process.env.NODE_ENV === 'development') {
    console.log('[CORS-DEBUG] Current configuration:', {
      environment: process.env.NODE_ENV,
      allowedOrigins: getAllowedOrigins(),
      domainConfigs: Object.keys(DOMAIN_CONFIGS)
    })
  }
}