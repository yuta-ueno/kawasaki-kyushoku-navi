// Service Worker for PWA
const CACHE_NAME = 'kawasaki-kyushoku-navi-v1'
const STATIC_CACHE_URLS = [
  '/',
  '/manifest.json',
  '/web-app-manifest-192x192.png',
  '/web-app-manifest-512x512.png'
]

// インストール時のキャッシュ
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets')
        return cache.addAll(STATIC_CACHE_URLS)
      })
      .then(() => {
        return self.skipWaiting()
      })
  )
})

// アクティベート時の古いキャッシュ削除
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      return self.clients.claim()
    })
  )
})

// フェッチ時のキャッシュ戦略（Network First）
self.addEventListener('fetch', (event) => {
  // APIリクエストの場合はネットワーク優先
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // ネットワークエラー時は適切なエラーレスポンス
          return new Response(
            JSON.stringify({ error: 'ネットワークエラーが発生しました' }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          )
        })
    )
    return
  }

  // 静的ファイルの場合はキャッシュ優先
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response
        }
        return fetch(event.request)
          .then((response) => {
            // 正常なレスポンスのみキャッシュ
            if (response.status === 200 && response.type === 'basic') {
              const responseToCache = response.clone()
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache)
                })
            }
            return response
          })
      })
      .catch(() => {
        // オフライン時のフォールバック
        if (event.request.destination === 'document') {
          return caches.match('/')
        }
      })
  )
})