# 川崎給食ナビ - アーキテクチャ仕様書

**最終更新:** 2025年8月27日  
**バージョン:** 2.1.0  
**文書種別:** 技術アーキテクチャ仕様書

---

## 目次

1. [システム概要](#システム概要)
2. [アプリケーションアーキテクチャ](#アプリケーションアーキテクチャ)
3. [データアーキテクチャ](#データアーキテクチャ)
4. [コンポーネントアーキテクチャ](#コンポーネントアーキテクチャ)
5. [APIレイヤーアーキテクチャ](#apiレイヤーアーキテクチャ)
6. [セキュリティアーキテクチャ](#セキュリティアーキテクチャ)
7. [インフラストラクチャアーキテクチャ](#インフラストラクチャアーキテクチャ)
8. [パフォーマンス最適化](#パフォーマンス最適化)
9. [ドメイン駆動設計(DDD)実装](#ドメイン駆動設計ddd実装)
10. [開発・デプロイメント](#開発デプロイメント)
11. [監視・可観測性](#監視可観測性)
12. [将来の検討事項](#将来の検討事項)

---

## システム概要

### 目的
川崎給食ナビは、川崎市立小中学校の給食メニュー情報を提供するNext.jsウェブアプリケーションです。保護者や生徒に対して、日々のメニュー、栄養情報、および3つの地区ゾーンの月間カレンダービューを提供します。

### 中核要件
- 地区別（A/B/C ゾーン）の今日の給食メニュー表示
- 月間メニューカレンダービューの提供
- 栄養情報（カロリー、タンパク質）の表示
- キャッシュによるオフライン機能のサポート
- モバイルファーストレスポンシブデザイン
- アプリライクな体験のためのPWA機能
- Firebaseとのリアルタイムデータ同期

### 主要ステークホルダー
- **主要ユーザー:** 川崎市の生徒の保護者・保護者
- **二次ユーザー:** 生徒、学校管理者
- **データプロバイダー:** 川崎市教育委員会
- **技術メンテナー:** 開発チーム

---

## アプリケーションアーキテクチャ

### フレームワーク・技術スタック

#### フロントエンドスタック
- **フレームワーク:** Next.js 14.2.32 (Pages Router)
- **ランタイム:** React 18 with Strict Mode
- **言語:** JavaScript (ES2022+) with 一部TypeScriptコンポーネント
- **スタイリング:** Tailwind CSS with カスタムSolarizedカラーパレット
- **状態管理:** データフェッチング用SWR + 設定用localStorage
- **UIコンポーネント:** Lucide React アイコン付きカスタムコンポーネント
- **ビルドツール:** Next.js組み込みwebpack設定

#### バックエンドスタック
- **APIレイヤー:** Next.js API Routes (サーバーレス関数)
- **データベース:** Google Cloud Firestore (NoSQLドキュメントデータベース)
- **認証:** Firebase Admin SDK (書き込み操作のみ)
- **キャッシュ:** レート制限とAPIキャッシュ用Upstash Redis
- **バリデーション:** Zod スキーマバリデーションライブラリ
- **エラー監視:** エラー追跡とパフォーマンス監視用Sentry

#### インフラストラクチャ
- **ホスティング:** Vercel (主要デプロイメントプラットフォーム)
- **CDN:** Vercel Edge Network
- **データベース:** Google Cloud Firestore
- **キャッシュ:** Upstash Redis
- **監視:** Sentry + Vercel Analytics
- **ドメイン:** SSL/TLS付きカスタムドメイン

### アーキテクチャパターン

#### クリーンアーキテクチャ（ヘキサゴナル）
アプリケーションは関心の分離を明確にしたクリーンアーキテクチャ原則に従います：

```
src/
├── domain/              # コアビジネスロジック (エンティティ、ユースケース)
├── infrastructure/      # 外部関心事 (データベース、キャッシュ)
├── interface/          # コントローラーとDTO
├── components/         # UIレイヤー (Reactコンポーネント)
├── pages/             # Next.jsルーティングとページコンポーネント
└── lib/               # 共有ユーティリティと設定
```

#### ドメイン駆動設計（DDD）
- **エンティティ:** ビジネスルールとバリデーション付き`Menu`エンティティ
- **リポジトリ:** Firebase実装付き抽象リポジトリパターン
- **ユースケース:** メニュー関連ビジネス操作
- **値オブジェクト:** 日付範囲、栄養値、地区識別子

---

## データアーキテクチャ

### データベース設計（Firestore）

#### コレクション構造
```
kawasaki_menus/
├── {YYYY-MM-DD-A}/    # ドキュメントIDパターン
│   ├── date: string   # ISO日付 (YYYY-MM-DD)
│   ├── district: string # A, B, または C
│   ├── dayOfWeek: string # 月, 火, 水, など
│   ├── menu: object
│   │   ├── items: string[]    # メニュー項目リスト
│   │   └── description: string # オプション説明
│   ├── nutrition: object
│   │   ├── energy: number     # カロリー (kcal)
│   │   └── protein: number    # タンパク質 (g)
│   ├── hasSpecialMenu: boolean
│   └── notes: string          # 学習ポイント
```

#### 地区ゾーン
- **地区A:** 川崎区・中原区 (Kawasaki-ku, Nakahara-ku)
- **地区B:** 幸区・多摩区・麻生区 (Saiwai-ku, Tama-ku, Asao-ku)  
- **地区C:** 高津区・宮前区 (Takatsu-ku, Miyamae-ku)

#### データアクセスパターン
- **今日のメニュー:** `{date}-{district}`による単一ドキュメント検索
- **月間ビュー:** 地区と日付でフィルタリングした範囲クエリ
- **統計クエリ:** 月間データからクライアント側で計算した集計

### セキュリティルール
```javascript
// firestore.rules
rules_version = "2";
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;        // パブリック読み取りアクセス
      allow write: if false;      // クライアント書き込みなし
    }
  }
}
```

---

## コンポーネントアーキテクチャ

### コンポーネント階層

#### ページコンポーネント
```
pages/
├── index.js           # メインアプリケーションページ
├── _app.js           # アプリ設定とプロバイダー
├── _error.tsx        # エラー境界
├── admin/import.js   # データインポートインターフェース
└── api/              # APIエンドポイント
```

#### UIコンポーネント構造
```
components/
├── common/
│   ├── Header.js          # ナビゲーションと地区選択
│   ├── Loading.js         # ローディング状態
│   ├── ErrorMessage.js    # エラー表示
│   └── StatsCards.js      # 月間統計
├── menu/
│   └── MenuCard.js        # 個別メニュー表示
├── pwa/
│   ├── InstallPWAButton.js
│   └── InstallInstructionsModal.js
├── share/
│   ├── ShareButton.js
│   └── ShareModal.js
└── webview/
    ├── LINEWebViewDetector.js
    └── OpenInBrowserModal.js
```

### コンポーネントパターン

#### データフェッチングパターン
- **SWR統合:** 全コンポーネントでデータフェッチングにSWRを使用
- **ローディング状態:** 全コンポーネント間で一貫したローディングUI
- **エラー境界:** フォールバックUIによる優雅なエラーハンドリング
- **オフラインサポート:** ネットワーク利用不可時にキャッシュされたデータを表示

#### 状態管理パターン
- **グローバル状態:** localStorageで永続化された地区選択
- **サーバー状態:** SWRが全てのサーバーデータフェッチングとキャッシュを管理
- **コンポーネント状態:** Reactフックでローカル UI状態を管理

#### アクセシビリティ機能
- **ARIAラベル:** スクリーンリーダーサポートの包括的対応
- **セマンティックHTML:** 適切な見出し階層とランドマーク
- **キーボードナビゲーション:** 完全なキーボードアクセシビリティ
- **高コントラスト:** 十分なコントラスト比でのSolarizedカラースキーム
- **フォーカス管理:** 明確なフォーカスインジケータ

---

## APIレイヤーアーキテクチャ

### APIエンドポイント

#### メニューAPI (`/api/menu/`)
```typescript
// GET /api/menu/today?date=2025-08-27&district=A
interface TodayMenuResponse {
  success: boolean;
  data: {
    date: string;
    district: 'A' | 'B' | 'C';
    dayOfWeek: string;
    menu: {
      items: string[];
      description?: string;
    };
    nutrition: {
      energy: number;
      protein: number;
    };
    hasSpecialMenu: boolean;
    notes?: string;
  };
  metadata: {
    requestId: string;
    timestamp: string;
    query: object;
    rateLimit: object;
  };
}

// GET /api/menu/monthly?year=2025&month=9&district=A
interface MonthlyMenuResponse {
  success: boolean;
  data: TodayMenuResponse['data'][];
  metadata: MonthlyMetadata;
}
```

### セキュリティ・バリデーション

#### 入力バリデーション（Zodスキーマ）
```javascript
// 今日のメニューバリデーション
const todaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  district: z.enum(['A', 'B', 'C'])
});

// 月間メニューバリデーション
const monthlySchema = z.object({
  year: z.coerce.number().int().min(2024).max(2030),
  month: z.coerce.number().int().min(1).max(12),
  district: z.enum(['A', 'B', 'C'])
});
```

#### レート制限
- **Upstash Redis:** サーバーレス関数間での分散レート制限
- **制限:** IP+Origin+Path組み合わせで毎分10リクエスト
- **ヘッダー:** レスポンスで標準レート制限ヘッダー
- **フォールバック:** Redis利用不可時の優雅な劣化

#### CORS設定
- **許可されたオリジン:** 本番ドメイン + 開発用localhost
- **メソッド:** GET、OPTIONSのみ
- **ヘッダー:** 標準セキュリティヘッダー
- **認証情報:** 非サポート（パブリックAPI）

---

## セキュリティアーキテクチャ

### クライアント側セキュリティ

#### コンテンツセキュリティポリシー
```javascript
// Next.jsセキュリティヘッダー経由で実装
headers: {
  'X-XSS-Protection': '1; mode=block',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()'
}
```

#### 入力サニタイゼーション
- **Zodバリデーション:** 厳格なスキーマによる全API入力バリデーション
- **SQLインジェクション防止:** NoSQL Firestoreによるインジェクション攻撃防止
- **XSS防止:** ReactのビルトインXSS保護 + CSPヘッダー

### APIセキュリティ

#### 認証モデル
- **読み取りアクセス:** パブリック（認証不要）
- **書き込みアクセス:** 管理者のみ（Firebase Admin SDK）
- **レート制限:** Redis分散ストレージによるIPベース

#### エラーハンドリング
- **カスタムエラークラス:** `RateLimitError`, `ValidationError`, `OriginError`
- **サニタイズされたレスポンス:** エラーメッセージに機密情報なし
- **Sentry統合:** 自動エラー報告とアラート

### データプライバシー
- **PII不使用:** アプリケーションは公開メニューデータのみ処理
- **アナリティクス:** 最小限、プライバシー重視のアナリティクス
- **クッキー:** 機能のための必須クッキーのみ

---

## インフラストラクチャアーキテクチャ

### デプロイメントアーキテクチャ

#### 本番環境
```
[ユーザー] -> [Vercel Edge Network] -> [Vercel上のNext.jsアプリ]
                                         |
                                    [Firebase Auth]
                                         |
                                [Google Cloud Firestore]
                                         |
                                   [Upstash Redis]
```

#### 開発環境
```
[開発者] -> [ローカルNext.js] -> [Firebase Emulators]
                    |
              [ローカルRedis] (オプション)
```

### スケーリング戦略
- **サーバーレス関数:** Vercel経由のAPIエンドポイント自動スケーリング
- **CDN:** 静的アセットのグローバルエッジ配信
- **データベース:** 地域レプリケーション付きFirestore自動スケーリング
- **キャッシュ:** マルチレイヤーキャッシュ（CDN、Redis、SWR）

---

## パフォーマンス最適化

### フロントエンド最適化

#### コード分割
- **動的インポート:** オンデマンドでロードされるモーダルコンポーネント
- **バンドル分析:** Webpack bundle analyzer統合
- **ツリーシェーキング:** 未使用コードの除去

#### データフェッチング戦略
```javascript
// SWRでのスマートキャッシュ
const { data, error, isLoading } = useSWR(apiUrl, fetcher, {
  refreshInterval: 0,           // ポーリングなし
  revalidateOnFocus: false,     // フォーカス時再取得なし
  revalidateOnReconnect: true,  // 再接続時再取得
  dedupingInterval: 30 * 60 * 1000, // 30分重複排除
  errorRetryCount: 0,           // 自動リトライなし
});
```

#### 画像・アセット最適化
- **Next.js Image:** 自動画像最適化
- **アイコンシステム:** 一貫した最適化アイコン用Lucide React
- **フォント読み込み:** 高速レンダリング用システムフォント

### バックエンド最適化

#### データベースクエリ
- **複合インデックス:** クエリ用に最適化されたFirestoreインデックス
- **クエリ制限:** 高コスト操作を防ぐ合理的制限
- **キャッシュ:** 頻繁にアクセスされるデータのRedisキャッシュ

#### APIレスポンス最適化
- **レスポンス圧縮:** Gzip圧縮有効
- **最小ペイロード:** レスポンスに必要なデータのみ含める
- **HTTPキャッシュ:** 異なるコンテンツタイプに適切なキャッシュヘッダー

---

## ドメイン駆動設計（DDD）実装

### ドメインモデル

#### コアエンティティ
```javascript
// ビジネスロジック付きMenuエンティティ
class Menu {
  constructor({ date, district, dayOfWeek, menu, nutrition, hasSpecialMenu, notes }) {
    this.validateInputs({ date, district, menu, nutrition });
    // ... プロパティの割り当て
  }

  isSpecial() {
    return this.hasSpecialMenu || 
           this.menu.items.some(item => 
             item.includes('★') || item.includes('⭐') || item.includes('特別')
           );
  }

  getDocumentId() {
    return `${this.date}-${this.district}`;
  }

  // 追加ビジネスメソッド...
}
```

#### リポジトリパターン
```javascript
// 抽象リポジトリインターフェース
class MenuRepository {
  async getTodayMenu(date, district) { throw new Error('Not implemented'); }
  async getMonthlyMenus(year, month, district) { throw new Error('Not implemented'); }
  async saveMenu(menu) { throw new Error('Not implemented'); }
}

// Firebase実装
class FirebaseMenuRepository extends MenuRepository {
  async getTodayMenu(date, district) {
    const docId = `${date}-${district}`;
    const docSnap = await getDoc(doc(db, 'kawasaki_menus', docId));
    return docSnap.exists() ? Menu.fromFirestoreData(docSnap.data()) : null;
  }
}
```

### 境界付きコンテキスト
- **メニューコンテキスト:** 給食メニュー管理のコアドメイン
- **ユーザーコンテキスト:** 地区選択と設定
- **通知コンテキスト:** システム通知と更新

---

## 開発・デプロイメント

### 開発ワークフロー

#### ローカル開発セットアップ
```bash
# 環境セットアップ
npm install
cp .env.example .env.local

# 開発サーバー
npm run dev              # 開発サーバー起動
firebase emulators:start # Firebase エミュレータ起動

# 品質保証
npm run lint            # ESLint チェック
npm run build           # 本番ビルドテスト
```

#### ビルド・デプロイメント
```bash
# 本番ビルド
npm run build
npm run start

# Vercel デプロイメント
npx vercel --prod       # 本番デプロイ
```

### 環境設定
```javascript
// 環境変数
NEXT_PUBLIC_FIREBASE_API_KEY=           # Firebase設定
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

UPSTASH_REDIS_URL=                      # Redisキャッシュ
UPSTASH_REDIS_TOKEN=

SENTRY_ORG=                             # エラー監視
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=
```

---

## 監視・可観測性

### エラー監視（Sentry）
- **エラー追跡:** 自動エラーキャプチャと報告
- **パフォーマンス監視:** APIレスポンス時間とデータベースクエリ
- **ユーザーフィードバック:** ユーザーフィードバック収集との統合
- **リリース追跡:** デプロイメントとリリース監視

### アプリケーションメトリクス
- **SWRメトリクス:** キャッシュヒット率とデータフェッチングパフォーマンス
- **ユーザーアナリティクス:** 基本的使用パターン（プライバシー準拠）
- **APIメトリクス:** リクエスト率、エラー率、レスポンス時間

### ログ戦略
- **開発:** 詳細情報付きコンソールログ
- **本番:** Sentry統合による構造化ログ
- **APIログ:** リクエストIDによるリクエスト/レスポンスログ

---

## 将来の検討事項

### 予定されている機能強化
- **多言語サポート:** 国際家族向け英語言語サポート
- **高度な通知:** メニュー更新のプッシュ通知
- **栄養分析:** 詳細な栄養分析とアレルゲン情報
- **カレンダー統合:** カレンダーアプリケーションへのエクスポート
- **食事計画:** 週間食事計画機能

### 技術的負債・改善
- **TypeScript移行:** JavaScriptからTypeScriptへの段階的移行
- **テストカバレッジ:** ユニットテストと統合テストの実装
- **パフォーマンス監視:** 強化されたパフォーマンス追跡と最適化
- **アクセシビリティ監査:** 定期的なアクセシビリティテストと改善

### スケーラビリティの検討
- **多都市サポート:** 川崎市外への拡張アーキテクチャ
- **リアルタイム更新:** ライブ更新のためのWebSocket統合
- **モバイルアプリ:** ネイティブモバイルアプリケーション開発
- **APIバージョニング:** 正式なAPIバージョニング戦略

---

## まとめ

川崎給食ナビアプリケーションは、React/Next.jsとFirebaseで構築された現代的でスケーラブルなウェブアプリケーションです。アーキテクチャはユーザーエクスペリエンス、アクセシビリティ、保守性を優先しながら、川崎市の家族に学校給食メニュー情報への信頼できるアクセスを提供します。

ドメイン駆動設計原則と組み合わせたクリーンアーキテクチャアプローチにより、要件が進化してもコードベースが保守可能で拡張可能であることが保証されます。包括的なセキュリティモデルとパフォーマンス最適化により、川崎コミュニティにサービスを提供するための本番対応の基盤が提供されます。

---

*この文書は、川崎給食ナビアプリケーションの権威的なアーキテクチャリファレンスとして機能します。システムに重要なアーキテクチャ変更が加えられる際は常に更新する必要があります。*