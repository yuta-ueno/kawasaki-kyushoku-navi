import { db } from '../../services/firebase/config'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import redis, { rateLimitIncrement } from '../../lib/redis'
import {
  validateInput,
  feedbackSchema,
  formatValidationErrors,
} from '../../lib/validation'
import { captureAPIError, captureSecurityEvent } from '../../lib/sentry'
import {
  handleApiError,
  checkRateLimitResult,
  validateOriginResult,
  validateInputResult,
  setCommonHeaders,
  formatSuccessResponse,
  getClientIP,
  generateRequestId
} from '../../lib/api-utils'
import { RateLimitError, ValidationError, OriginError } from '../../lib/errors'
import {
  setCorsHeaders,
  handlePreflightRequest,
  validateOriginForApi,
  logCorsAccess,
} from '../../lib/cors-config'

/**
 * フィードバックAPI
 * ユーザーからのフィードバック（評価+コメント）を受け取りFirestoreに保存
 * 
 * レート制限: 1日1回
 * バリデーション: rating(1-5), comment(50文字以内), district(A/B/C)
 */
export default async function handler(req, res) {
  const requestId = generateRequestId()
  const clientIP = getClientIP(req)
  
  try {
    // プリフライト処理
    if (req.method === 'OPTIONS') {
      return handlePreflightRequest(req, res)
    }

    // POSTメソッドのみ許可
    if (req.method !== 'POST') {
      return res.status(405).json({
        error: 'Method not allowed',
        message: 'POSTメソッドのみサポートしています',
        metadata: { requestId, timestamp: new Date().toISOString() }
      })
    }

    // CORS検証
    const originResult = validateOriginForApi(req, res)
    if (!originResult.valid) {
      return res.status(originResult.error.status).json(originResult.error.response)
    }

    // レート制限チェック（1日1回）
    const rateLimitKey = `feedback:${clientIP}:${new Date().toISOString().split('T')[0]}`
    const rateLimitResult = await rateLimitIncrement(rateLimitKey, 1, 86400) // 24時間
    
    if (!checkRateLimitResult(rateLimitResult, res, requestId)) {
      // セキュリティイベントとして記録
      captureSecurityEvent('feedback_rate_limit_exceeded', {
        ip: clientIP,
        requestId,
        limit: 1,
        window: '24h'
      })
      return
    }

    // 入力データの検証
    const validationResult = validateInput(feedbackSchema, req.body)
    if (!validateInputResult(validationResult, res, requestId)) {
      return
    }

    const { rating, comment, district } = validationResult.data

    // Firestoreにフィードバックを保存
    const feedbackData = {
      rating,
      comment: comment.trim(),
      district,
      timestamp: new Date().toISOString(),
      ip: clientIP ? clientIP.substring(0, clientIP.lastIndexOf('.')) + '.***' : 'unknown',
      userAgent: req.headers['user-agent']?.substring(0, 100) || 'unknown',
      requestId,
      createdAt: serverTimestamp()
    }

    try {
      const docRef = await addDoc(collection(db, 'feedback'), feedbackData)
      
      // 成功ログ
      console.log('[FEEDBACK-SUCCESS]', {
        docId: docRef.id,
        rating,
        district,
        commentLength: comment.length,
        ip: feedbackData.ip,
        requestId,
        timestamp: new Date().toISOString()
      })

      // 共通ヘッダー設定
      setCommonHeaders(res)
      
      // 成功レスポンス
      return res.status(201).json(formatSuccessResponse({
        message: 'フィードバックを受け付けました。ありがとうございます！',
        id: docRef.id
      }, requestId))

    } catch (firestoreError) {
      console.error('[FEEDBACK-FIRESTORE-ERROR]', {
        error: firestoreError.message,
        requestId,
        data: { rating, district, commentLength: comment.length }
      })

      captureAPIError(firestoreError, 'feedback', {
        requestId,
        operation: 'firestore_save',
        data: feedbackData
      })

      throw new Error('フィードバックの保存に失敗しました')
    }

  } catch (error) {
    console.error('[FEEDBACK-ERROR]', {
      error: error.message,
      stack: error.stack,
      requestId,
      method: req.method,
      ip: clientIP
    })

    return handleApiError(error, res, requestId, 'feedback')
  }
}