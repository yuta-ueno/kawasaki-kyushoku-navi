# 川崎給食ナビ - アーキテクチャ仕様書

## 📋 プロジェクト概要

**プロジェクト名**: 川崎給食ナビ  
**バージョン**: 2.1.0 (Security & Performance Enhanced)  
**最終更新**: 2025年8月25日  
**開発者**: かわさき給食ナビ開発チーム

### 目的
川崎市立小中学校の給食献立情報を提供するWebアプリケーション

### 主要機能
1. **給食メニュー機能** - 今日・月間の給食献立表示、栄養情報提供
2. **管理機能** - データインポート、統計情報表示
3. **モバイル対応** - レスポンシブデザイン、PWA対応
4. **セキュリティ** - 包括的なセキュリティ対策とパフォーマンス最適化

### 廃止機能
- **給水スポット機能** - 独立したアプリケーションとして分離予定（仕様書は別途保管）

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
│   │   └── Menu.js           # 給食メニューエンティティ
│   ├── use-cases/            # ユースケース
│   │   └── MenuUseCases.js   # メニュー関連ビジネスロジック
│   └── repositories/         # リポジトリインターfaces
│       └── MenuRepository.js
│
├── infrastructure/            # Infrastructure Layer (外部接続)
│   ├── repositories/         # リポジトリ実装
│   │   └── FirebaseMenuRepository.js
│   ├── external/            # 外部サービス接続
│   │   └── Firebase.js
│   └── cache/               # キャッシュサービス
│       └── InMemoryCache.js
│
├── interface/                # Interface Layer (API境界)
│   ├── controllers/         # APIコントローラー
│   │   └── MenuController.js
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
│   │   └── Districts.js    # 地区関連定数
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
│   │   └── menu/
│   └── api/v2/             # 新API (Clean Architecture)
│       └── menu/
└── styles/                  # スタイルファイル
```

---

## 🔧 技術スタック

### コア技術
- **Next.js 14.2.32** (Pages Router) - セキュリティアップデート適用
- **React 18** (UI Framework)
- **Firebase Firestore** (Database)
- **Upstash Redis** (Rate Limiting & Cache)

### データフェッチング
- **SWR 2.3.6** (Client-side Data Fetching)
- **Custom Hooks** (State Management)

### スタイリング
- **Tailwind CSS 3.4** (Utility-first CSS)
- **Solarized Color Scheme** (統一テーマ)


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
- **セキュリティ**: レート制限(10req/min)、CORS検証、入力値検証

#### 1.2 月間給食カレンダー
- **エンドポイント**: `/api/menu/monthly`
- **パラメータ**: `year`, `month`, `district`
- **機能**: 月間給食カレンダー、統計情報表示
- **セキュリティ**: レート制限(5req/min)、大量データ制限(最大50件)

#### 1.3 データインポート（管理者用）
- **エンドポイント**: `/api/v2/menu/import`
- **機能**: JSON形式での一括メニューデータインポート
- **セキュリティ**: 認証必須、CSRFトークン検証

### 2. 共通機能

#### 2.1 地区管理
- **地区**: A(川崎区・中原区), B(幸区・多摩区・麻生区), C(高津区・宮前区)
- **永続化**: LocalStorage
- **切り替え**: リアルタイム反映

#### 2.2 キャッシュ戦略
- **今日のメニュー**: 5分キャッシュ
- **月間メニュー**: 24時間キャッシュ
- **重複リクエスト防止**: SWR dedupingInterval設定

#### 2.3 データ取得最適化仕様

##### 通信エラー時リトライ設定

**グローバル設定** (`src/lib/swr-config.js`)
- **エラーリトライ回数**: `0回` (自動リトライ無効)
- **ローディングタイムアウト**: `15秒`
- **重複リクエスト防止**: `30分`

**今日の献立データ** (`useTodayMenu`)
- **通常更新間隔**: `無効` (自動更新停止)
- **エラーリトライ回数**: `0回`
- **フォーカス時更新**: 無効 (タブ切り替え時の不要リクエスト防止)
- **再接続時更新**: 有効 (ネットワーク復帰時のみ)
- **重複リクエスト防止**: `30分`

**月間献立データ** (`useMonthlyMenus`)
- **通常更新間隔**: `無効` (完全に停止)
- **エラーリトライ回数**: `0回`
- **フォーカス時更新**: 無効
- **再接続時更新**: 無効
- **重複リクエスト防止**: `24時間`

**最適化の特徴**
- **10秒周期リクエスト問題**: 完全解決
- **タブ切り替え時リクエスト**: 防止済み
- **不要な再レンダリング**: 最小化

##### パフォーマンス最適化フロー
1. **初期ロード**: 必要最小限のデータ取得
2. **キャッシュ活用**: 長期間キャッシュでリクエスト数最小化
3. **エラー状態**: グレースフル degradation、既存データ表示継続
4. **手動更新**: ユーザー操作時のみデータ再取得

##### 最適化の効果
- **ページ読み込み速度**: 大幅改善
- **不要なAPI呼び出し**: 完全排除
- **ユーザー体験**: スムーズな操作感
- **サーバー負荷**: 軽減

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


---

## 🔌 API仕様

### v1 API (メイン運用)
```
GET /api/menu/today?date={date}&district={district}
GET /api/menu/monthly?year={year}&month={month}&district={district}
```

### v2 API (Clean Architecture対応・実験的)
```
GET /api/v2/menu/today?date={date}&district={district}
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
- **Origin検証**: 厳格な検証ロジック実装

### 2. レート制限
- **今日のメニュー**: 10リクエスト/分/IP
- **月間メニュー**: 5リクエスト/分/IP (重いクエリのため)
- **実装**: Upstash Redis
- **ヘッダー**: `X-RateLimit-*` による通知
- **フォールバック**: Redis障害時はリクエスト許可

### 3. セキュリティヘッダー
- **XSS Protection**: `X-XSS-Protection: 1; mode=block`
- **Content Type Options**: `X-Content-Type-Options: nosniff`
- **Frame Options**: `X-Frame-Options: DENY`
- **Referrer Policy**: `Referrer-Policy: strict-origin-when-cross-origin`
- **DNS Prefetch Control**: `X-DNS-Prefetch-Control: on`
- **Permissions Policy**: カメラ・マイク等の制限

### 4. 入力検証
- **バリデーション**: Zod スキーマによる厳格な型チェック
- **サニタイゼーション**: XSS対策、SQLインジェクション対策
- **データ制限**: 未来データ取得制限、最大件数制限
- **不正パラメータ**: 自動除去とログ記録

### 5. 環境変数セキュリティ
- **機密情報**: プレースホルダー値でデフォルト設定
- **警告コメント**: セキュリティリスクの明記
- **.gitignore**: 証明書・秘密鍵・ログファイル等の保護
- **バージョン管理**: 機密情報の履歴から完全除去

### 6. 脆弱性対策
- **Next.js**: v14.2.32（重要なセキュリティパッチ適用済み）
- **依存関係監視**: npm audit による定期チェック
- **残存脆弱性**: Firebase関連の間接依存（影響範囲限定的）

### 7. エラーハンドリング
- **監視**: Sentry統合
- **ログ**: 構造化ログ出力
- **情報漏洩防止**: エラーメッセージのサニタイズ
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
- **バンドル**: Tree Shaking, Code Splitting, Package Import Optimization
- **CSS**: Tailwind Purge
- **フォント**: Google Fonts最適化
- **Header圧縮**: Gzip/Brotli圧縮有効
- **X-Powered-By**: セキュリティのため無効化

### 3. パフォーマンス指標
- **FCP**: < 1.5秒
- **LCP**: < 2.5秒
- **CLS**: < 0.1
- **API Response**: < 500ms
- **バンドルサイズ**: メインページ187KB、管理画面249KB
- **ビルド時間**: 大幅改善（最適化により）

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
- [x] セキュリティ監査と脆弱性修正
- [x] パフォーマンス最適化
- [x] コード品質改善とリファクタリング
- [ ] 既存フック・コンポーネントのClean Architecture移行
- [ ] テストカバレッジ向上

### 中期（6ヶ月）
- [ ] 給水スポット機能の独立アプリ開発
- [ ] PWA機能強化
- [ ] アクセシビリティ向上
- [ ] Firebase関連脆弱性の解決（公式アップデート待ち）

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

**最終更新**: 2025年8月25日  
**ドキュメントバージョン**: 2.1.0

## 📈 更新履歴

### v2.1.0 (2025-08-25)
- セキュリティ強化: Next.js v14.2.32アップデート、包括的セキュリティヘッダー実装
- パフォーマンス最適化: SWR設定最適化、不要リクエスト完全排除
- アーキテクチャ整理: 給水スポット機能削除、メニュー機能に特化
- コード品質向上: React最適化、依存関係整理
- 脆弱性対策: 10件の重要な脆弱性修正

### v2.0.0 (2025-08-24)
- Clean Architecture導入
- 給水スポット機能追加
- v2 API実装