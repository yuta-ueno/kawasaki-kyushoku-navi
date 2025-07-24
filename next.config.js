/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // 画像最適化
  images: {
    domains: ['localhost'],
  },
  
  // ESLint設定
  eslint: {
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig
