import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../../services/firebase/config'
import redis, { rateLimitIncrement } from '../../../lib/redis'
import {
  validateInput,
  todaySchema,
  formatValidationErrors,
  getTodayJST,
} from '../../../lib/validation'
import { captureAPIError, captureSecurityEvent } from '../../../lib/sentry'
import {
  handleApiError,
  checkRateLimitResult,
  validateOriginResult,
  validateInputResult,
  setCommonHeaders,
  formatSuccessResponse,
  getClientIP,
  generateRequestId
} from '../../../lib/api-utils'
import { RateLimitError, ValidationError, OriginError } from '../../../lib/errors'
import {
  setCorsHeaders,
  handlePreflightRequest,
  validateOriginForApi,
  logCorsAccess,
  debugCorsConfig
} from '../../../lib/cors-config'

// 日付から曜日を取得するヘルパー関数
function getDayOfWeek(dateString) {
  const date = new Date(dateString)
  const days = ['日', '月', '火', '水', '木', '金', '土']
  return days[date.getDay()]
}

// CORS設定は cors-config.js に移動済み
// デバッグ情報出力（開発環境のみ）
if (process.env.NODE_ENV === 'development') {
  debugCorsConfig()
}

// 分散レート制限（Upstash Redis）
async function checkRateLimit(req) {
  const clientIP = getClientIP(req)
  const origin = req.headers.origin || req.headers.referer || 'unknown'
  const path = req.url || '/api/menu/today'

  const key = `rate_limit:${clientIP}:${origin}:${path}`
  const window = 60 // 1分間
  const limit = 10 // 10リクエスト

  try {
    const count = await rateLimitIncrement(key, window)

    if (count > limit) {
      return {
        allowed: false,
        count,
        remaining: 0,
        resetTime: Math.ceil(Date.now() / 1000) + window,
      }
    }

    return {
      allowed: true,
      count,
      remaining: limit - count,
      resetTime: Math.ceil(Date.now() / 1000) + window,
    }
  } catch (error) {
    console.error('Redis rate limit error:', error)
    // フォールバック: Redis障害時はリクエストを通す
    return { allowed: true, count: 0, remaining: limit, resetTime: 0 }
  }
}

// 古い関数は削除済み - cors-config.js と api-utils.js に移動

export default async function handler(req, res) {
  const requestId = generateRequestId()

  try {
    // 1. プリフライトリクエスト（OPTIONS）の処理
    if (req.method === 'OPTIONS') {
      return handlePreflightRequest(req, res)
    }

    // 2. CORS設定と Origin検証
    const corsValidation = validateOriginForApi(req, res)
    if (!corsValidation.valid) {
      return res.status(corsValidation.error.status).json(corsValidation.error.response)
    }

    // 3. HTTPメソッド制限
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET, OPTIONS')
      return res.status(405).json({
        error: 'Method not allowed',
        allowed: ['GET', 'OPTIONS'],
        metadata: { requestId, timestamp: new Date().toISOString() },
      })
    }

    // 4. レート制限チェック（Redis設定が無い場合は簡略化）
    let rateLimitResult
    const hasRedisConfig = process.env.UPSTASH_REDIS_REST_URL && 
                          process.env.UPSTASH_REDIS_REST_URL !== 'disabled-for-demo'
    
    if (!hasRedisConfig) {
      // Redis設定が無い場合はシンプルなレート制限
      rateLimitResult = {
        allowed: true,
        count: 1,
        remaining: 9,
        resetTime: Math.ceil(Date.now() / 1000) + 60
      }
    } else {
      rateLimitResult = await checkRateLimit(req)
      checkRateLimitResult(rateLimitResult, 10, 60) // RateLimitErrorをthrowする可能性
    }

    // Rate limiting headers（成功時）
    res.setHeader('X-RateLimit-Limit', '10')
    res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
    res.setHeader('X-RateLimit-Reset', rateLimitResult.resetTime.toString())

    // 5. 入力値検証（新しいエラーハンドリング）
    const validationResult = validateInput(todaySchema, req.query, {
      stripUnknown: true,
      allowPartial: false,
    })
    const validatedData = validateInputResult(validationResult) // ValidationErrorをthrowする可能性

    // バリデーション済みデータの取得
    const { date = getTodayJST(), district } = validatedData

    // 6. 共通ヘッダ設定（キャッシュ、セキュリティ）
    // CORS設定は既に validateOriginForApi で設定済み
    setCommonHeaders(res, {
      cacheMaxAge: 300, // 5分
      staleWhileRevalidate: 60, // 1分
      allowedOrigin: corsValidation.origin,
      endpoint: 'today'
    })

    // 6. データ取得処理
    const docId = `${date}-${district}`

    // モックデータ対応（Firebase設定が不完全な場合）
    const usesMockData = process.env.NODE_ENV === 'development' || 
                        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID === 'kawasaki-kyushoku-dev'
    
    if (usesMockData) {
      // モックデータを返す
      const mockData = {
        date: date,
        dayOfWeek: getDayOfWeek(date),
        district: district,
        menu: {
          items: [
            'ご飯',
            'みそ汁（わかめ・豆腐）',
            '鶏肉の照り焼き',
            'ひじきの煮物',
            '牛乳'
          ],
          description: '今日は栄養バランスの良い和食の献立です。'
        },
        nutrition: {
          energy: 650,
          protein: 25.2,
          fat: 18.5,
          carbohydrate: 95.3,
          calcium: 350,
          iron: 2.8,
          vitaminA: 280,
          vitaminB1: 0.8,
          vitaminB2: 0.6,
          vitaminC: 25,
          salt: 2.1
        },
        hasSpecialMenu: false,
        notes: '開発環境用のモックデータです。'
      }

      return res.status(200).json(
        formatSuccessResponse(mockData, {
          requestId,
          query: { date, district },
          rateLimit: {
            remaining: rateLimitResult.remaining,
            resetTime: rateLimitResult.resetTime,
          },
          validation: {
            schema: 'todaySchema',
            processedFields: Object.keys(validatedData),
          },
          environment: 'development',
          mockData: true
        })
      )
    }

    const docRef = doc(db, 'kawasaki_menus', docId)
    const docSnap = await getDoc(docRef)

    // 7. レスポンス返却
    if (docSnap.exists()) {
      const data = docSnap.data()

      // セキュリティ: 不要なメタデータを除去
      const sanitizedData = {
        date: data.date,
        dayOfWeek: data.dayOfWeek,
        district: data.district,
        menu: data.menu,
        nutrition: data.nutrition,
        hasSpecialMenu: data.hasSpecialMenu,
        notes: data.notes,
      }

      return res.status(200).json(
        formatSuccessResponse(sanitizedData, {
          requestId,
          query: { date, district },
          rateLimit: {
            remaining: rateLimitResult.remaining,
            resetTime: rateLimitResult.resetTime,
          },
          validation: {
            schema: 'todaySchema',
            processedFields: Object.keys(validatedData),
          },
        })
      )
    } else {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: `指定された日付(${date})・地区(${district})の給食データが見つかりません`,
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          query: { date, district },
        },
      })
    }
  } catch (error) {
    // 8. 統一エラーハンドリング
    return handleApiError(error, res, requestId)
  }
}
