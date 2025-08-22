// lib/swr-config.js
// かわさき給食ナビ用のSWR設定

// APIリクエスト用のfetcher関数（API統一対応）
const fetcher = async url => {
  const res = await fetch(url)

  // レスポンスチェック
  if (!res.ok) {
    const error = new Error('データの取得に失敗しました')

    // エラー詳細を追加
    try {
      const errorData = await res.json()
      error.info = errorData
      error.message = errorData.message || error.message
    } catch {
      error.info = { message: 'サーバーエラーが発生しました' }
    }

    error.status = res.status
    throw error
  }

  return res.json()
}

// SWRのグローバル設定（月1回更新最適化）
export const swrConfig = {
  fetcher,

  // キャッシュとリフレッシュ設定
  refreshInterval: 0, // 自動更新は個別に設定
  revalidateOnFocus: true, // ユーザーがアプリに戻った時のみ更新
  revalidateOnReconnect: true, // ネットワーク再接続時に更新
  revalidateIfStale: false, // 古いデータを許容（月1更新のため）

  // パフォーマンス設定（給食アプリ用に最適化）
  dedupingInterval: 30 * 60 * 1000, // 30分間の重複リクエスト防止
  loadingTimeout: 15000, // 15秒でローディング警告
  errorRetryInterval: 10000, // エラー時のリトライ間隔（10秒）
  errorRetryCount: 1, // 最大リトライ回数（1回のみ）

  // エラーハンドリング
  onError: (error, key) => {
    console.error('🚨 SWRエラー:', {
      timestamp: new Date().toISOString(),
      key,
      error: error.message,
      status: error.status,
    })

    // 本番環境では外部ログサービスに送信
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'swr_error', {
        error_message: error.message,
        api_endpoint: key,
      })
    }
  },

  // パフォーマンス監視
  onLoadingSlow: (key, config) => {
    console.warn('⚠️ SWR読み込み遅延:', key)
  },

  // 成功時のログ（開発環境のみ）
  onSuccess: (data, key, config) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ SWRデータ取得成功:', key)
    }
  },
}

// エラー判定関数
export function isRetryableError(error) {
  // リトライ可能なエラーを判定
  return error.status >= 500 || error.status === 429 || !error.status
}

// キャッシュキー生成ヘルパー
export function createCacheKey(endpoint, params = {}) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value))
    }
  })

  const queryString = searchParams.toString()
  return queryString ? `${endpoint}?${queryString}` : endpoint
}
