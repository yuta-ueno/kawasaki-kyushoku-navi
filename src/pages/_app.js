// src/pages/_app.js
import Head from 'next/head';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        {/* デフォルトのタイトル（個別ページで上書きされない場合） */}
        <title>かわさき給食ナビ | 川崎市の学校給食献立情報</title>
        
        {/* 共通メタタグ */}
        <meta name="description" content="川崎市立小中学校の給食献立を簡単チェック。今日の献立、週間メニュー、栄養情報をスマホで確認できます。" />
        <meta name="keywords" content="川崎市,給食,献立,学校給食,川崎,アプリ,栄養,アレルギー" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Open Graph / SNS共有用 */}
        <meta property="og:site_name" content="かわさき給食ナビ" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="ja_JP" />
        
        {/* PWA関連 */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4CAF50" />
        
        {/* ファビコン */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
