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

  // セキュリティヘッダー
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // XSS Protection
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // Content Type Options
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // Referrer Policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // Frame Options
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          // DNS Prefetch Control
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          // Permissions Policy
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()'
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          // API専用セキュリティヘッダー
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate'
          },
          // Rate Limiting情報
          {
            key: 'X-RateLimit-Policy',
            value: '10req/min'
          },
        ],
      },
    ];
  },

  // Content Security Policy
  async rewrites() {
    return [];
  },

  // Environment validation
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Performance optimizations
  experimental: {
    optimizePackageImports: [
      '@sentry/nextjs',
      'lucide-react',
      'swr',
      'firebase/firestore',
      'zod',
    ],
  },

  // Output optimization
  compress: true,
  poweredByHeader: false,

  // Bundle analyzer (for optimization)
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev && !isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@sentry/nextjs': '@sentry/nextjs',
      };
    }
    return config;
  },
}

module.exports = nextConfig


// Injected content via Sentry wizard below

const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(
  module.exports,
  {
    // For all available options, see:
    // https://www.npmjs.com/package/@sentry/webpack-plugin#options

    org: "yuta-ueno",
    project: "kawasaki-lunch-navi",

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    tunnelRoute: "/monitoring",

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,
  }
);
