import React, { useState } from 'react';
import Head from 'next/head'; // 追加: SEO用
import { Calendar, ChefHat, MapPin } from 'lucide-react';
import { useTodayMenu, useMonthlyMenus } from '../hooks/useKawasakiMenu';
import MenuCard from '../components/menu/MenuCard';
import Loading from '../components/common/Loading';
import Header from '../components/common/Header';
import StatsCards from '../components/common/StatsCards';
import ErrorMessage from '../components/common/ErrorMessage';

export default function HomePage() {
  // 現在の年月を取得
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  // 状態管理
  const [selectedDistrict, setSelectedDistrict] = useState('A');
  
  // Firestoreからデータを取得
  const { menu: todayMenu, loading: todayLoading, error: todayError } = useTodayMenu(selectedDistrict);
  const { 
    menus: monthlyMenus, 
    loading: monthlyLoading, 
    error: monthlyError 
  } = useMonthlyMenus(2025, 7, selectedDistrict); // 実際のデータは2025年7月

  // 統計情報を計算
  const stats = React.useMemo(() => {
    if (!monthlyMenus || monthlyMenus.length === 0) {
      return {
        totalMenus: 0,
        specialMenus: 0,
        avgCalories: 0
      };
    }

    const totalMenus = monthlyMenus.length;
    const specialMenus = monthlyMenus.filter(menu => menu.isSpecial || menu.hasSpecialMenu).length;
    const avgCalories = Math.round(
      monthlyMenus.reduce((sum, menu) => sum + (menu.nutrition?.energy || 0), 0) / totalMenus
    );

    return {
      totalMenus,
      specialMenus,
      avgCalories
    };
  }, [monthlyMenus]);

  return (
    <>
      {/* SEO最適化 - 追加部分 */}
      <Head>
        <title>川崎市の給食献立情報 | かわさき給食ナビ - 今日の学校給食をスマホで簡単チェック</title>
        <meta 
          name="description" 
          content="川崎市立小中学校の給食献立を簡単チェック。今日の献立、週間メニュー、栄養情報、アレルギー対応をスマホで確認できます。北部・中部・南部の給食センター別対応。保護者の皆様に安心をお届けします。" 
        />
        <meta 
          name="keywords" 
          content="川崎市,給食,献立,学校給食,今日,スマホ,アプリ,栄養,カロリー,アレルギー,保護者,北部,中部,南部,給食センター" 
        />
        
        {/* Open Graph / SNS共有用 */}
        <meta property="og:title" content="川崎市の給食献立情報 | かわさき給食ナビ" />
        <meta property="og:description" content="川崎市の学校給食献立を簡単チェック。今日の献立、栄養情報をスマホで確認" />
        <meta property="og:url" content="https://kawasaki-kyushoku.jp/" />
        <meta property="og:image" content="https://kawasaki-kyushoku.jp/og-image.png" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="かわさき給食ナビ" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="かわさき給食ナビ | 川崎市の給食献立情報" />
        <meta name="twitter:description" content="川崎市の学校給食献立をスマホで簡単チェック" />
        <meta name="twitter:image" content="https://kawasaki-kyushoku.jp/og-image.png" />
        
        {/* 正規URL */}
        <link rel="canonical" href="https://kawasaki-kyushoku.jp/" />
        
        {/* 構造化データ */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "かわさき給食ナビ",
              "description": "川崎市の給食献立情報を提供するサービス",
              "url": "https://kawasaki-kyushoku.jp",
              "publisher": {
                "@type": "Organization",
                "name": "かわさき給食ナビ運営チーム"
              },
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://kawasaki-kyushoku.jp/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              },
              "areaServed": {
                "@type": "City",
                "name": "川崎市",
                "addressCountry": "JP"
              }
            })
          }}
        />
      </Head>

       <div className="min-h-screen bg-blue-200">
        {/* ヘッダー */}
        <Header selectedDistrict={selectedDistrict} setSelectedDistrict={setSelectedDistrict} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 今日の給食セクション */}
          <section className="mb-12">
            <div className="flex items-center mb-6">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-xl mr-3">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <div>
                {/* SEO最適化: h1タグに変更 */}
                <h1 className="text-2xl font-bold text-gray-900">川崎市の給食献立情報</h1>
                <p className="text-gray-600">
                  {currentDate.toLocaleDateString('ja-JP', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    weekday: 'long'
                  })}
                </p>
              </div>
            </div>

            {/* SEO最適化: h2タグ追加 */}
            <h2 className="text-xl font-semibold text-gray-800 mb-4">今日の川崎市学校給食献立</h2>

            {todayLoading ? (
              <Loading message="今日の給食を読み込み中..." />
            ) : todayError ? (
              <ErrorMessage 
                title="今日の給食データの取得に失敗しました" 
                message={todayError}
              />
            ) : todayMenu ? (
              <div className="max-w-2xl">
                <MenuCard menu={todayMenu} isToday={true} />
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 text-center max-w-2xl">
                <div className="text-gray-500 mb-4">
                  <ChefHat className="w-12 h-12 mx-auto mb-4 opacity-50" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">今日は給食がありません</h3>
                <p className="text-gray-500">土日祝日や夏休み期間は給食がお休みです</p>
              </div>
            )}
          </section>

          {/* 月間給食セクション */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-blue-500 to-green-500 p-2 rounded-xl mr-3">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  {/* SEO最適化: h2タグ追加 */}
                  <h2 className="text-2xl font-bold text-gray-900">2025年7月の給食献立</h2>
                  <p className="text-gray-600">川崎市{selectedDistrict}地区小学校の献立表</p>
                </div>
              </div>
            </div>

            {/* 統計カード */}
            <StatsCards stats={stats} loading={monthlyLoading} />

            {/* 献立一覧 */}
            <div className="mt-8">
              {monthlyLoading ? (
                <Loading message="月間献立を読み込み中..." />
              ) : monthlyError ? (
                <ErrorMessage 
                  title="月間献立データの取得に失敗しました" 
                  message={monthlyError}
                />
              ) : monthlyMenus && monthlyMenus.length > 0 ? (
                <>
                  <div className="mb-6 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      {monthlyMenus.length}件の献立が見つかりました
                    </div>
                    <div className="text-xs text-gray-500">
                      最終更新: {new Date().toLocaleDateString('ja-JP')}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {monthlyMenus
                      .sort((a, b) => new Date(a.date) - new Date(b.date))
                      .map((menu, index) => (
                        <MenuCard 
                          key={`${menu.date}-${menu.district}-${index}`} 
                          menu={menu} 
                          isToday={false}
                        />
                      ))}
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-12 text-center">
                  <div className="text-gray-500 mb-4">
                    <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">献立データがありません</h3>
                  <p className="text-gray-500 mb-4">
                    2025年7月の{selectedDistrict}地区の献立データが見つかりません
                  </p>
                  <div className="text-sm text-gray-400">
                    データが正しくインポートされているか確認してください
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* フッター情報 */}
          <footer className="mt-12 bg-white rounded-xl p-6 shadow-md border border-gray-100">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                {/* SEO最適化: h3タグ追加 */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">川崎市給食について</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <p className="mb-2">• 栄養価は小学校中学年の基準で表示されています</p>
                    <p className="mb-2">• アレルギー情報は学校にお問い合わせください</p>
                  </div>
                  <div>
                    <p className="mb-2">• 食材の都合により献立が変更になる場合があります</p>
                    <p>• 特別メニュー（⭐）は季節行事や特別企画の献立です</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    データ提供: 川崎市教育委員会 | 
                    アプリ開発: かわさき給食ナビ開発チーム | 
                    最終更新: 2025年7月12日
                  </p>
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </>
  );
}
