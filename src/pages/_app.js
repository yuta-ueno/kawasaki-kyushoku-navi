// src/pages/_app.js
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import '../styles/globals.css';

// Google Analytics設定
const GA_TRACKING_ID = 'G-BKM38HXTKS';

// ページビュー追跡
const pageview = (url) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_location: url,
    });
  }
};

// イベント追跡
const event = ({ action, category, label, value }) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

export default function App({ Component, pageProps }) {
  const router = useRouter();

  // ページ遷移追跡
  useEffect(() => {
    const handleRouteChange = (url) => {
      pageview(url);
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  return (
    <>
      <Head>
        {/* Google Analytics */}
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_TRACKING_ID}', {
                page_location: window.location.href,
                page_title: document.title,
                // 川崎市特化カスタム設定
                custom_map: {
                  'custom_parameter_1': 'district',
                  'custom_parameter_2': 'menu_date',
                  'custom_parameter_3': 'user_type'
                }
              });
            `,
          }}
        />
        
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

// Global関数として利用可能にする（他のコンポーネントから使用可能）
if (typeof window !== 'undefined') {
  window.kawasakiAnalytics = {
    // メニュー表示追跡
    trackMenuView: (district, date, isToday = false) => {
      event({
        action: 'menu_view',
        category: 'engagement',
        label: `${district}地区_${date}`,
        value: isToday ? 2 : 1
      });
    },

    // 地区変更追跡
    trackDistrictChange: (fromDistrict, toDistrict) => {
      event({
        action: 'district_change',
        category: 'navigation',
        label: `${fromDistrict}_to_${toDistrict}`,
        value: 1
      });
    },

    // 特別メニュー表示追跡
    trackSpecialMenu: (district, date) => {
      event({
        action: 'special_menu_view',
        category: 'engagement',
        label: `${district}地区_${date}`,
        value: 3
      });
    },

    // メニュー展開追跡
    trackMenuExpand: (district, date, isExpanded) => {
      event({
        action: 'menu_expand',
        category: 'interaction',
        label: `${district}地区_${date}_${isExpanded ? 'expand' : 'collapse'}`,
        value: isExpanded ? 1 : 0
      });
    },

    // エラー追跡
    trackError: (errorType, errorMessage) => {
      event({
        action: 'error',
        category: 'error',
        label: `${errorType}: ${errorMessage}`,
        value: 0
      });
    }
  };
}
