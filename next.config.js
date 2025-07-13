/** @type {import('next').NextConfig} */
const nextConfig = {
  // React Strict Mode 有効化
  reactStrictMode: true,
  
  // 実験的機能（Next.js 15対応）
  experimental: {
    // appDir は Next.js 13.4以降デフォルトで有効
    // 明示的な指定は不要になりました
  },
  
  // PWA設定（将来的に有効化予定）
  // pwa: {
  //   dest: 'public',
  //   register: true,
  //   skipWaiting: true,
  // },
  
  // 画像最適化
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // 環境変数
  env: {
    CUSTOM_KEY: 'kawasaki-kyushoku-navi',
  },
}

module.exports = nextConfig
