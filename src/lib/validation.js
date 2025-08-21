// src/lib/validation.js
import { z } from 'zod'

// =============================================================================
// 共通スキーマ定義
// =============================================================================

// 地区スキーマ（川崎市の給食センター別）
const districtSchema = z.enum(['A', 'B', 'C', '北部', '中部', '南部'], {
  errorMap: () => ({ message: '地区は A, B, C, 北部, 中部, 南部 のいずれかを指定してください' })
})

// 日付スキーマ（YYYY-MM-DD形式）
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: '日付は YYYY-MM-DD 形式で指定してください'
})

// 年スキーマ（2024-2030年の範囲）
const yearSchema = z.coerce.number().int().min(2024).max(2030).refine(
  (year) => {
    const currentYear = new Date().getFullYear()
    return year >= 2024 && year <= currentYear + 1
  },
  { message: '年は2024年から来年までの範囲で指定してください' }
)

// 月スキーマ（1-12月）
const monthSchema = z.coerce.number().int().min(1).max(12).refine(
  (month) => {
    // 基本的な月の範囲チェック
    return month >= 1 && month <= 12
  },
  { message: '月は1から12の間で指定してください' }
)

// =============================================================================
// API別スキーマ定義
// =============================================================================

// Today API用スキーマ
export const todaySchema = z.object({
  date: dateSchema.optional(),
  district: districtSchema.default('A')
}).refine((data) => {
  // 日付が指定された場合の追加検証
  if (data.date) {
    const inputDate = new Date(data.date)
    const today = new Date()
    const maxDate = new Date()
    maxDate.setDate(today.getDate() + 7) // 1週間後まで許可
    
    return inputDate <= maxDate
  }
  return true
}, {
  message: '日付は1週間以内の範囲で指定してください',
  path: ['date']
})

// Monthly API用スキーマ
export const monthlySchema = z.object({
  year: yearSchema,
  month: monthSchema,
  district: districtSchema.default('A')
}).refine((data) => {
  // 未来の月の制限（2ヶ月先まで）
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const requestDate = new Date(data.year, data.month - 1)
  const maxDate = new Date(currentYear, currentMonth + 1) // 2ヶ月後まで
  
  return requestDate <= maxDate
}, {
  message: '2ヶ月以降の未来のデータは取得できません',
  path: ['year', 'month']
})

// Schools API用スキーマ（将来の拡張用）
export const schoolsSchema = z.object({
  district: districtSchema.optional(),
  type: z.enum(['小学校', '中学校', 'all']).default('all')
})

// =============================================================================
// バリデーション実行関数
// =============================================================================

/**
 * 共通バリデーション実行関数
 * @param {z.ZodSchema} schema - Zodスキーマ
 * @param {object} data - バリデーション対象のデータ
 * @param {object} options - オプション設定
 * @returns {object} バリデーション結果
 */
export function validateInput(schema, data, options = {}) {
  const { 
    stripUnknown = true,  // 未知のフィールドを除去
    allowPartial = false  // 部分的なデータを許可
  } = options

  try {
    // 未知のフィールドの除去
    if (stripUnknown && data && typeof data === 'object') {
      const cleanData = {}
      
      // Zodスキーマから許可されたキーを取得
      const allowedKeys = ['date', 'district', 'year', 'month'] // 基本的な許可キー
      
      allowedKeys.forEach(key => {
        if (data.hasOwnProperty(key)) {
          cleanData[key] = data[key]
        }
      })
      
      // 未知のパラメータをログ出力（開発環境のみ）
      const unknownKeys = Object.keys(data).filter(key => !allowedKeys.includes(key))
      if (unknownKeys.length > 0 && process.env.NODE_ENV !== 'production') {
        console.warn('Unknown parameters ignored:', unknownKeys)
      }
      
      data = cleanData
    }

    // バリデーション実行
    const result = allowPartial ? schema.partial().parse(data) : schema.parse(data)
    
    return {
      success: true,
      data: result,
      errors: null
    }
  } catch (error) {
    console.error('Validation error caught:', error); // デバッグ用ログ追加
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: error.issues.map(err => ({  // error.errors → error.issues に修正
          field: err.path.join('.') || 'root',
          message: err.message,
          code: err.code,
          received: err.received
        }))
      }
    }
    
    // Zod以外のエラー
    console.error('Non-Zod validation error:', error); // デバッグ用ログ追加
    return {
      success: false,
      data: null,
      errors: [{
        field: 'unknown',
        message: `バリデーションエラーが発生しました: ${error.message}`,
        code: 'unknown_error'
      }]
    }
  }
}

/**
 * APIレスポンス用のエラーフォーマット関数
 * @param {array} errors - バリデーションエラー配列
 * @returns {object} API用エラーレスポンス
 */
export function formatValidationErrors(errors) {
  return {
    error: 'Validation failed',
    message: 'リクエストパラメータが正しくありません',
    details: errors.map(err => ({
      field: err.field,
      message: err.message
    })),
    validParams: {
      today: {
        date: 'YYYY-MM-DD形式の日付（オプション）',
        district: ['A', 'B', 'C', '北部', '中部', '南部']
      },
      monthly: {
        year: '2024-2030の整数',
        month: '1-12の整数', 
        district: ['A', 'B', 'C', '北部', '中部', '南部']
      }
    }
  }
}

// =============================================================================
// ヘルパー関数
// =============================================================================

/**
 * 日付の妥当性チェック（JST基準）
 * @param {string} dateString - 日付文字列
 * @returns {boolean} 有効な日付かどうか
 */
export function isValidJSTDate(dateString) {
  const date = new Date(dateString + 'T00:00:00+09:00') // JSTで解釈
  return !isNaN(date.getTime()) && dateString === date.toISOString().split('T')[0]
}

/**
 * 現在の日付取得（JST）
 * @returns {string} YYYY-MM-DD形式の今日の日付
 */
export function getTodayJST() {
  const now = new Date()
  const jstOffset = 9 * 60 // 日本時間は UTC+9
  const jstTime = new Date(now.getTime() + (jstOffset * 60 * 1000))
  return jstTime.toISOString().split('T')[0]
}

/**
 * デバッグ用：バリデーションの詳細ログ
 * @param {string} apiName - API名
 * @param {object} input - 入力データ
 * @param {object} result - バリデーション結果
 */
export function logValidation(apiName, input, result) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[${apiName}] Validation:`, {
      input,
      success: result.success,
      errors: result.errors,
      output: result.data
    })
  }
}