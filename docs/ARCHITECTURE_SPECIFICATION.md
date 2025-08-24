# 川崎給食ナビ - アーキテクチャ仕様書

## 📋 プロジェクト概要

**プロジェクト名**: 川崎給食ナビ  
**バージョン**: 2.0.0 (Clean Architecture)  
**最終更新**: 2025年8月24日  
**開発者**: かわさき給食ナビ開発チーム

### 目的
川崎市立小中学校の給食献立情報と市内給水スポット情報を統合提供するWebアプリケーション

### 主要機能
1. **給食メニュー機能** - 今日・月間の給食献立表示、栄養情報提供
2. **給水スポット機能** - 市内給水場所の検索・地図表示
3. **管理機能** - データインポート、統計情報表示
4. **モバイル対応** - レスポンシブデザイン、PWA対応

---

## 🏗️ アーキテクチャ概要

### クリーンアーキテクチャの採用

このプロジェクトは**クリーンアーキテクチャ**を採用し、以下の4層構造で設計されています：

```
┌─────────────────────────────────────┐
│          Framework Layer            │  ← UI、Next.js Pages、React Hooks
├─────────────────────────────────────┤
│          Interface Layer            │  ← Controllers、DTOs、Presenters
├─────────────────────────────────────┤
│        Infrastructure Layer         │  ← External APIs、Database、Cache
├─────────────────────────────────────┤
│           Domain Layer              │  ← Entities、Use Cases、Repositories
└─────────────────────────────────────┘
```

### 依存関係の方向
- **外側の層は内側の層に依存**
- **内側の層は外側の層に依存しない**
- **Dependency Inversion Principle** の徹底

---

## 📁 ディレクトリ構造

```
src/
├── domain/                     # Domain Layer (ビジネスロジック)
│   ├── entities/              # エンティティ
│   │   ├── Menu.js           # 給食メニューエンティティ
│   │   └── WaterSpot.js      # 給水スポットエンティティ
│   ├── use-cases/            # ユースケース
│   │   ├── MenuUseCases.js   # メニュー関連ビジネスロジック
│   │   └── WaterSpotUseCases.js # 給水スポット関連ビジネスロジック
│   └── repositories/         # リポジトリインターfaces
│       ├── MenuRepository.js
│       └── WaterSpotRepository.js
│
├── infrastructure/            # Infrastructure Layer (外部接続)
│   ├── repositories/         # リポジトリ実装
│   │   ├── FirebaseMenuRepository.js
│   │   └── StaticWaterSpotRepository.js
│   ├── external/            # 外部サービス接続
│   │   └── Firebase.js
│   └── cache/               # キャッシュサービス
│       └── InMemoryCache.js
│
├── interface/                # Interface Layer (API境界)
│   ├── controllers/         # APIコントローラー
│   │   ├── MenuController.js
│   │   └── WaterSpotController.js
│   ├── presenters/         # データプレゼンター
│   └── dto/                # データ転送オブジェクト
│
├── framework/               # Framework Layer (UI・技術詳細)
│   ├── ui/                 # UIコンポーネント
│   ├── pages/              # Next.js ページ
│   └── hooks/              # React Hooks
│       └── useCleanMenus.js # クリーンアーキテクチャ対応フック
│
├── shared/                  # 共有層
│   ├── constants/          # 定数定義
│   │   ├── Districts.js    # 地区関連定数
│   │   └── WaterSpots.js   # 給水スポット関連定数
│   ├── types/              # 型定義
│   │   └── Menu.js         # メニュー型定義
│   ├── utils/              # ユーティリティ
│   └── config/             # 設定ファイル
│
├── components/              # 既存UIコンポーネント (段階的移行)
├── hooks/                   # 既存フック (段階的移行)
├── lib/                     # 既存ライブラリ (段階的移行)
├── pages/                   # Next.js Pages Router
│   ├── api/                # 既存API (v1)
│   │   ├── menu/
│   │   └── water-spots/
│   └── api/v2/             # 新API (Clean Architecture)
│       └── menu/
└── styles/                  # スタイルファイル
```

---

## 🔧 技術スタック

### コア技術
- **Next.js 14.2.5** (Pages Router)
- **React 18** (UI Framework)
- **Firebase Firestore** (Database)
- **Upstash Redis** (Rate Limiting & Cache)

### データフェッチング
- **SWR 2.3.6** (Client-side Data Fetching)
- **Custom Hooks** (State Management)

### スタイリング
- **Tailwind CSS 3.4** (Utility-first CSS)
- **Solarized Color Scheme** (統一テーマ)

### 地図機能
- **React Leaflet 4.2** (Map Component)
- **Leaflet 1.9** (Map Library)

### 開発・品質管理
- **ESLint** (Code Linting)
- **Prettier** (Code Formatting)
- **Sentry** (Error Monitoring)

---

## 🎯 主要機能仕様

### 1. 給食メニュー機能

#### 1.1 今日の給食表示
- **エンドポイント**: `/api/menu/today`, `/api/v2/menu/today`
- **パラメータ**: `date` (YYYY-MM-DD), `district` (A/B/C)
- **機能**: 指定日・地区の給食メニューと栄養情報を表示

#### 1.2 月間給食カレンダー
- **エンドポイント**: `/api/menu/monthly`
- **パラメータ**: `year`, `month`, `district`
- **機能**: 月間給食カレンダー、統計情報表示

#### 1.3 データインポート（管理者用）
- **エンドポイント**: `/api/v2/menu/import`
- **機能**: JSON形式での一括メニューデータインポート

### 2. 給水スポット機能

#### 2.1 スポット検索・一覧
- **エンドポイント**: `/api/water-spots/list`
- **フィルター**: 区、カテゴリ、営業状況
- **機能**: 条件に応じた給水スポット検索

#### 2.2 地図表示
- **コンポーネント**: `WaterSpotMap`
- **機能**: Leafletを使用した地図上のスポット表示

#### 2.3 スポット詳細
- **エンドポイント**: `/api/water-spots/detail`
- **機能**: 個別スポットの詳細情報表示

### 3. 共通機能

#### 3.1 地区管理
- **地区**: A(川崎区・中原区), B(幸区・多摩区・麻生区), C(高津区・宮前区)
- **永続化**: LocalStorage
- **切り替え**: リアルタイム反映

#### 3.2 キャッシュ戦略
- **今日のメニュー**: 5分キャッシュ
- **月間メニュー**: 1時間キャッシュ
- **給水スポット**: 1時間キャッシュ

---

## 🗄️ データモデル

### Menu Entity
```javascript
{
  date: string,           // YYYY-MM-DD
  district: string,       // A, B, C
  dayOfWeek: string,      // 曜日
  menu: {
    items: string[],      // メニュー項目
    description: string   // 説明
  },
  nutrition: {
    energy: number,       // カロリー (kcal)
    protein: number       // タンパク質 (g)
  },
  hasSpecialMenu: boolean,
  notes: string | null
}
```

### WaterSpot Entity
```javascript
{
  id: string,
  name: string,
  category: string,       // カテゴリ
  ward: string,           // 区
  address: string,
  location: {
    latitude: number,
    longitude: number
  },
  hours: object,          // 営業時間
  description: string,
  access: string,         // アクセス情報
  facilities: string[],   // 設備情報
  notes: string
}
```

---

## 🔌 API仕様

### v1 API (既存・段階的廃止予定)
```
GET /api/menu/today?date={date}&district={district}
GET /api/menu/monthly?year={year}&month={month}&district={district}
GET /api/water-spots/list?ward={ward}&category={category}&light={boolean}
GET /api/water-spots/detail?id={spotId}
```

### v2 API (Clean Architecture対応)
```
GET /api/v2/menu/today?date={date}&district={district}
GET /api/v2/menu/monthly?year={year}&month={month}&district={district}
POST /api/v2/menu/import (Admin)
GET /api/v2/menu/statistics?startDate={date}&endDate={date}&district={district}
```

### 共通レスポンス形式
```javascript
{
  success: boolean,
  data: object | array,
  metadata: {
    requestId: string,
    timestamp: string,
    cached: boolean,
    query: object
  },
  error?: string,
  message?: string
}
```

---

## 🛡️ セキュリティ仕様

### 1. CORS設定
- **本番環境**: `https://www.kawasaki-kyushoku.jp`のみ許可
- **開発環境**: `localhost`ポート許可
- **プリフライト**: OPTIONS リクエスト対応

### 2. レート制限
- **制限**: 10リクエスト/分/IP
- **実装**: Upstash Redis
- **ヘッダー**: `X-RateLimit-*` による通知

### 3. 入力検証
- **バリデーション**: Zod スキーマ
- **サニタイゼーション**: XSS対策
- **型安全性**: TypeScript (JSDoc)

### 4. エラーハンドリング
- **監視**: Sentry統合
- **ログ**: 構造化ログ出力
- **フォールバック**: グレースフル degradation

---

## 📊 パフォーマンス仕様

### 1. キャッシュ戦略
- **CDN**: Vercel Edge Network
- **API Cache**: `Cache-Control` ヘッダー
- **Client Cache**: SWR + LocalStorage
- **Memory Cache**: InMemoryCache Service

### 2. 最適化
- **画像**: Next.js Image Optimization
- **バンドル**: Tree Shaking, Code Splitting
- **CSS**: Tailwind Purge
- **フォント**: Google Fonts最適化

### 3. 目標値
- **FCP**: < 1.5秒
- **LCP**: < 2.5秒
- **CLS**: < 0.1
- **API Response**: < 500ms

---

## 🚀 デプロイメント

### 本番環境
- **Platform**: Vercel
- **Domain**: `https://www.kawasaki-kyushoku.jp`
- **Database**: Firebase Firestore (本番プロジェクト)
- **Cache**: Upstash Redis

### 開発環境
- **Local**: `npm run dev` (localhost:3000)
- **Firebase**: Emulator対応
- **Hot Reload**: Fast Refresh

### CI/CD
- **Git**: GitHub
- **Deploy**: Vercel GitHub連携
- **Env Variables**: Vercel Dashboard管理

---

## 🧪 テスト仕様

### 単体テスト
- **Entities**: ビジネスロジックテスト
- **Use Cases**: ユースケーステスト
- **Repositories**: モックを使用したテスト

### 統合テスト
- **API**: エンドポイントテスト
- **UI**: React Testing Library

### E2Eテスト
- **主要フロー**: メニュー表示、地区変更、給水スポット検索

---

## 📝 開発ガイドライン

### 1. クリーンアーキテクチャの原則
- **Single Responsibility**: 各層は単一の責任を持つ
- **Dependency Inversion**: 抽象に依存し、具象に依存しない
- **Open/Closed**: 拡張に開き、修正に閉じる

### 2. コーディング規約
- **命名**: 日本語コメント + 英語変数名
- **ファイル**: 機能別ディレクトリ分け
- **Import**: 相対パス回避、絶対パス使用

### 3. 段階的移行戦略
- **Phase 1**: 新アーキテクチャ導入（完了）
- **Phase 2**: 既存コードの段階的移行
- **Phase 3**: 旧コードの削除とクリーンアップ

---

## 🔮 今後の拡張計画

### 短期（3ヶ月）
- [ ] 既存フック・コンポーネントのClean Architecture移行
- [ ] v1 APIの段階的廃止
- [ ] テストカバレッジ向上

### 中期（6ヶ月）
- [ ] GraphQL導入検討
- [ ] PWA機能強化
- [ ] アクセシビリティ向上

### 長期（1年）
- [ ] TypeScript完全移行
- [ ] マイクロサービス化検討
- [ ] リアルタイム機能追加

---

## 📞 サポート・連絡先

**開発チーム**: かわさき給食ナビ開発チーム  
**Email**: contact@kawasaki-kyushoku.jp  
**Repository**: [GitHub](https://github.com/kawasaki-kyushoku-navi)  
**Issues**: GitHubのIssue管理  

---

## 📄 ライセンス

このプロジェクトは[MIT License](../LICENSE)の下で公開されています。

---

**最終更新**: 2025年8月24日  
**ドキュメントバージョン**: 2.0.0