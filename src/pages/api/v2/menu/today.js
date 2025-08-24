/**
 * API Endpoint: Today's Menu (Clean Architecture)
 * /api/v2/menu/today
 */

import { getMenuController } from '../../../../interface/controllers/MenuController.js';
import {
  validateInput,
  todaySchema,
  getTodayJST,
} from '../../../../lib/validation.js';
import {
  handleApiError,
  validateOriginResult,
  setCommonHeaders,
  getClientIP,
  generateRequestId,
  checkRateLimitResult,
} from '../../../../lib/api-utils.js';
import {
  validateOriginForApi,
  handlePreflightRequest,
  logCorsAccess,
} from '../../../../lib/cors-config.js';
import { checkRateLimit } from '../../../../lib/rate-limit.js';

export default async function handler(req, res) {
  const requestId = generateRequestId();
  req.requestId = requestId;

  try {
    // 1. プリフライトリクエスト処理
    if (req.method === 'OPTIONS') {
      return handlePreflightRequest(req, res);
    }

    // 2. CORS検証
    const corsValidation = validateOriginForApi(req, res);
    if (!corsValidation.valid) {
      return res.status(corsValidation.error.status).json(corsValidation.error.response);
    }

    // 3. HTTPメソッド制限
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET, OPTIONS');
      return res.status(405).json({
        success: false,
        error: 'Method not allowed',
        metadata: { requestId, timestamp: new Date().toISOString() }
      });
    }

    // 4. レート制限チェック
    const rateLimitResult = await checkRateLimit(req);
    checkRateLimitResult(rateLimitResult, 10, 60);

    // 5. 入力値検証
    const validationResult = validateInput(todaySchema, req.query, {
      stripUnknown: true,
      allowPartial: false,
    });
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.errors,
        metadata: { requestId, timestamp: new Date().toISOString() }
      });
    }

    const { date = getTodayJST(), district } = validationResult.data;

    // 6. 共通ヘッダ設定
    setCommonHeaders(res, {
      cacheMaxAge: 300, // 5分
      staleWhileRevalidate: 60,
      allowedOrigin: corsValidation.origin,
      endpoint: 'today-v2'
    });

    // レート制限ヘッダ
    res.setHeader('X-RateLimit-Limit', '10');
    res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    res.setHeader('X-RateLimit-Reset', rateLimitResult.resetTime.toString());

    // 7. クエリパラメータをリクエストに追加
    req.validatedQuery = { date, district };

    // 8. コントローラーに処理を委譲
    const controller = getMenuController();
    return await controller.getTodayMenu(req, res);

  } catch (error) {
    return handleApiError(error, res, requestId);
  }
}

// API設定
export const config = {
  api: {
    externalResolver: false,
  },
};