# Kawasaki Kyushoku Navi - Project Overview

## Purpose
川崎市の学校給食献立を表示するNext.jsアプリケーション。Firestoreからデータを取得し、Solarized配色でアクセシブルなインターフェースを提供。

## Tech Stack
- **Frontend**: Next.js 14 (Pages Router), React 18, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Firebase Firestore
- **State Management**: SWR, React hooks
- **Security**: Rate limiting (Upstash Redis), CORS validation
- **Monitoring**: Sentry
- **Deployment**: Vercel

## Architecture
- **Data Flow**: Firestore → API Routes → SWR → React Components
- **Collection**: `kawasaki_menus` with document format `{YYYY-MM-DD}-{district}`
- **Districts**: A (川崎区・中原区), B (幸区・多摩区・麻生区), C (高津区・宮前区)
- **JST Timezone**: Custom date handling for Japan Standard Time

## Key Components
- Main page: `src/pages/index.js`
- Today's menu API: `src/pages/api/menu/today.js`
- Monthly menu API: `src/pages/api/menu/monthly.js`
- Data fetching hooks: `src/hooks/useKawasakiMenu.js`