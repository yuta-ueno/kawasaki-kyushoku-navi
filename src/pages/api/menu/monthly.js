import { collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { db } from '../../../services/firebase/config'
import redis, { rateLimitIncrement } from '../../../lib/redis'
import {
  validateInput,
  monthlySchema,
  formatValidationErrors,
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

// CORS設定は cors-config.js に移動済み
// デバッグ情報出力（開発環境のみ）
if (process.env.NODE_ENV === 'development') {
  debugCorsConfig()
}

// 分散レート制限（Upstash Redis）
async function checkRateLimit(req) {
  const clientIP = getClientIP(req)
  const origin = req.headers.origin || req.headers.referer || 'unknown'
  const path = req.url || '/api/menu/monthly'

  const key = `rate_limit:${clientIP}:${origin}:${path}`
  const window = 60 // 1分間
  const limit = 5 // 5リクエスト（月間データは重いため）

  try {
    const count = await rateLimitIncrement(key, window)

    if (isNaN(count)) {
      console.error('Count is NaN - falling back')
      return { allowed: true, count: 0, remaining: limit, resetTime: 0 }
    }

    const remaining = Math.max(0, limit - count)
    const resetTime = Math.ceil(Date.now() / 1000) + window

    if (count > limit) {
      return {
        allowed: false,
        count,
        remaining: 0,
        resetTime,
      }
    }

    return {
      allowed: true,
      count,
      remaining,
      resetTime,
    }
  } catch (error) {
    console.error('Rate limit check failed:', error)
    // フォールバック: Redis障害時はリクエストを通す
    return { allowed: true, count: 0, remaining: limit, resetTime: 0 }
  }
}

// 古い関数は削除済み - cors-config.js と api-utils.js に移動

// 日付から曜日を取得するヘルパー関数
function getDayOfWeek(dateString) {
  // YYYY-MM-DD形式の日付文字列をJSTで正確に処理
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day) // ローカル時間で作成
  const days = ['日', '月', '火', '水', '木', '金', '土']
  return days[date.getDay()]
}


// データサニタイゼーション
function sanitizeMenuData(doc) {
  const data = doc.data()

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
    month: data.month,
  }
}

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
        remaining: 4,
        resetTime: Math.ceil(Date.now() / 1000) + 60
      }
    } else {
      rateLimitResult = await checkRateLimit(req)
      checkRateLimitResult(rateLimitResult, 5, 60) // RateLimitErrorをthrowする可能性
    }

    // Rate limiting headers（成功時）
    res.setHeader('X-RateLimit-Limit', '5')
    res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
    res.setHeader('X-RateLimit-Reset', rateLimitResult.resetTime.toString())

    // 5. 入力値検証（新しいエラーハンドリング）
    const validationResult = validateInput(monthlySchema, req.query, {
      stripUnknown: true,
      allowPartial: false,
    })
    const validatedData = validateInputResult(validationResult) // ValidationErrorをthrowする可能性

    // バリデーション済みデータの取得
    const { year, month, district } = validatedData

    // 6. 共通ヘッダ設定（キャッシュ、セキュリティ）
    // CORS設定は既に validateOriginForApi で設定済み
    setCommonHeaders(res, {
      cacheMaxAge: 86400, // 24時間
      staleWhileRevalidate: 600, // 10分
      allowedOrigin: corsValidation.origin,
      endpoint: 'monthly'
    })

    // 6. データ取得処理
    const menusRef = collection(db, 'kawasaki_menus')
    const q = query(
      menusRef,
      where('year', '==', year),
      where('month', '==', month),
      where('district', '==', district),
      orderBy('date', 'asc')
    )

    const querySnapshot = await getDocs(q)
    
    // 7. データサニタイゼーション
    const menus = querySnapshot.docs.map(sanitizeMenuData)

    // 8. データサイズ制限とパフォーマンス保護
    const maxResults = 50 // 最大50件まで
    const limitedMenus = menus.slice(0, maxResults)

    if (menus.length > maxResults) {
      console.warn(
        `Large dataset detected: ${menus.length} items, limited to ${maxResults}`,
        {
          year,
          month,
          district,
          requestId,
        }
      )

      // 大量データ検出時のログ
      logSecurityEvent('LARGE_DATASET_REQUEST', req, {
        totalCount: menus.length,
        limitedTo: maxResults,
        year,
        month,
        district,
        requestId,
      })
    }

    // 9. 統計情報の計算
    const statistics = {
      totalDays: limitedMenus.length,
      specialMenuDays: limitedMenus.filter(menu => menu.hasSpecialMenu).length,
      averageCalories:
        limitedMenus.length > 0
          ? Math.round(
              limitedMenus
                .filter(menu => menu.nutrition?.energy)
                .reduce((sum, menu) => sum + menu.nutrition.energy, 0) /
                limitedMenus.filter(menu => menu.nutrition?.energy).length
            )
          : 0,
      dateRange:
        limitedMenus.length > 0
          ? {
              start: limitedMenus[0]?.date,
              end: limitedMenus[limitedMenus.length - 1]?.date,
            }
          : null,
    }

    // 10. レスポンス返却
    return res.status(200).json(
      formatSuccessResponse(limitedMenus, {
        requestId,
        query: { year, month, district },
        count: limitedMenus.length,
        totalCount: menus.length,
        limited: menus.length > maxResults,
        statistics,
        rateLimit: {
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime,
        },
        validation: {
          schema: 'monthlySchema',
          processedFields: Object.keys(validatedData),
        },
      })
    )
  } catch (error) {
    // 11. 統一エラーハンドリング
    return handleApiError(error, res, requestId)
  }
}
