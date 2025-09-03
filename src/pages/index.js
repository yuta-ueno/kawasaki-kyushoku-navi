import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { Calendar, ChefHat, MapPin } from 'lucide-react'
import { useKawasakiMenuApp } from '../hooks/useKawasakiMenu'
import MenuCard from '../components/menu/MenuCard'
import Loading from '../components/common/Loading'
import Header from '../components/common/Header'
import StatsCards from '../components/common/StatsCards'
import ErrorMessage from '../components/common/ErrorMessage'

export default function HomePage() {
  const router = useRouter()

  // 現在の年月を取得
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  let currentMonth = currentDate.getMonth() + 1

  // 8月の場合は9月として表示
  let displayMonth = currentMonth
  if (currentMonth === 8 && currentYear === 2025) {
    displayMonth = 9
  }

  // SWR統合フックを使用（給食情報専用アプリのため常時有効）
  const app = useKawasakiMenuApp()

  // 統計情報を計算（再レンダリング最適化）
  const stats = React.useMemo(() => {
    const monthlyMenus = app.monthlyMenus?.menus || []

    if (!monthlyMenus || monthlyMenus.length === 0) {
      return {
        totalMenus: 0,
        specialMenus: 0,
        avgCalories: 0,
      }
    }

    const totalMenus = monthlyMenus.length
    const specialMenus = monthlyMenus.filter(
      menu => menu.isSpecial || menu.hasSpecialMenu
    ).length
    const avgCalories =
      totalMenus > 0
        ? Math.round(
            monthlyMenus.reduce(
              (sum, menu) => sum + (menu.nutrition?.energy || 0),
              0
            ) / totalMenus
          )
        : 0

    return {
      totalMenus,
      specialMenus,
      avgCalories,
    }
  }, [app.monthlyMenus.menus]) // .menusへの直接参照で不要な再計算を防ぐ

  // アプリの準備ができていない場合
  if (!app.isSchoolLoaded) {
    return (
      <div className="min-h-screen bg-solarized-base3 flex items-center justify-center">
        <Loading message="アプリを準備中..." />
      </div>
    )
  }

  return (
    <>
      {/* SEO最適化 */}
      <Head>
        <title>
          川崎市の給食献立情報 | かわさき給食ナビ -
          今日の学校給食をスマホで簡単チェック
        </title>
        <meta
          name="description"
          content="川崎市立小中学校の給食献立を簡単チェック。今日の献立、週間メニュー、栄養情報、アレルギー対応をスマホで確認できます。北部・中部・南部の給食センター別対応。保護者の皆様に安心をお届けします。"
        />
        <meta
          name="keywords"
          content="川崎市,給食,献立,学校給食,今日,スマホ,アプリ,栄養,カロリー,アレルギー,保護者,北部,中部,南部,給食センター"
        />

        {/* Open Graph / SNS共有用 */}
        <meta
          property="og:title"
          content="川崎市の給食献立情報 | かわさき給食ナビ"
        />
        <meta
          property="og:description"
          content="川崎市の学校給食献立を簡単チェック。今日の献立、栄養情報をスマホで確認"
        />
        <meta property="og:url" content="https://kawasaki-kyushoku.jp/" />
        <meta
          property="og:image"
          content="https://kawasaki-kyushoku.jp/og-image.png"
        />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="かわさき給食ナビ" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="かわさき給食ナビ | 川崎市の給食献立情報"
        />
        <meta
          name="twitter:description"
          content="川崎市の学校給食献立をスマホで簡単チェック"
        />
        <meta
          name="twitter:image"
          content="https://kawasaki-kyushoku.jp/og-image.png"
        />

        {/* 正規URL */}
        <link rel="canonical" href="https://kawasaki-kyushoku.jp/" />

        {/* 構造化データ */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'かわさき給食ナビ',
              description: '川崎市の給食献立情報を提供するサービス',
              url: 'https://kawasaki-kyushoku.jp',
              publisher: {
                '@type': 'Organization',
                name: 'かわさき給食ナビ運営チーム',
              },
              potentialAction: {
                '@type': 'SearchAction',
                target:
                  'https://kawasaki-kyushoku.jp/search?q={search_term_string}',
                'query-input': 'required name=search_term_string',
              },
              areaServed: {
                '@type': 'City',
                name: '川崎市',
                addressCountry: 'JP',
              },
            }),
          }}
        />
      </Head>

      <div className="min-h-screen bg-solarized-base3">
        {/* ヘッダー */}
        <Header
          selectedDistrict={app.selectedSchool}
          setSelectedDistrict={app.updateSchool}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* オフライン表示 */}
          {!app.isOnline && (
            <div className="mb-6 bg-orange-100 border border-orange-300 text-orange-800 px-4 py-3 rounded-lg">
              📵 オフライン中（キャッシュデータを表示しています）
            </div>
          )}

          {/* 今日の給食セクション */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-solarized-base02 mb-4">
              今日・明日の川崎市小学校給食献立
            </h2>

            {/* 今日と明日の2日分の献立を表示 */}
            <div className="grid gap-6 max-w-4xl">
              <div>
                <MenuCard isToday={true} selectedSchool={app.selectedSchool} />
              </div>
              <div>
                <MenuCard
                  isToday={false}
                  isTomorrow={true}
                  selectedSchool={app.selectedSchool}
                />
              </div>
            </div>
          </section>

          {/* 月間給食セクション */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-solarized-blue to-solarized-green p-2 rounded-xl mr-3">
                  <Calendar className="w-6 h-6 text-solarized-base3" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-solarized-base02">
                    {currentYear}年{displayMonth}月の月間献立リスト
                  </h2>
                  <p className="text-solarized-base01">
                    川崎市{app.selectedSchool}地区小学校の献立表
                  </p>
                </div>
              </div>
            </div>

            {/* 統計カード */}
            <StatsCards stats={stats} loading={app.monthlyMenus.loading} />

            {/* 献立一覧 */}
            <div className="mt-8">
              {app.monthlyMenus.loading ? (
                <Loading message="月間献立を読み込み中..." />
              ) : app.monthlyMenus.error ? (
                <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-12 text-center">
                  <div className="text-red-500 mb-4">
                    <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  </div>
                  <h3 className="text-xl font-semibold text-red-600 mb-2">
                    データの取得に失敗しました
                  </h3>
                  <p className="text-gray-600 mb-4">
                    しばらく後に自動で再試行されます
                  </p>
                  <p className="text-sm text-gray-500">
                    {app.monthlyMenus.error}
                  </p>
                </div>
              ) : app.monthlyMenus.menus &&
                app.monthlyMenus.menus.length > 0 ? (
                <>
                  <div className="mb-6">
                    <div className="text-sm text-solarized-base01">
                      {app.monthlyMenus.menus.length}件の献立が見つかりました
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {app.monthlyMenus.menus
                      .sort((a, b) => new Date(a.date) - new Date(b.date))
                      .map((menu, index) => (
                        <MenuCard
                          key={`${menu.date}-${menu.district}-${index}`}
                          debugDate={menu.date}
                          isToday={false}
                          menuData={menu}
                        />
                      ))}
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-12 text-center">
                  <div className="text-gray-500 mb-4">
                    <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  </div>
                  <h3 className="text-xl font-semibold text-solarized-base01 mb-2">
                    献立データがありません
                  </h3>
                  <p className="text-solarized-base00 mb-4">
                    {currentYear}年{currentMonth}月の{app.selectedSchool}
                    地区の献立データが見つかりません
                  </p>
                  <div className="text-sm text-solarized-base0">
                    夏休み期間は給食がお休みです
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* フッター情報 */}
          <footer className="mt-12 bg-white rounded-xl p-6 shadow-md border border-gray-100">
            <div className="flex items-start space-x-3">
              <div className="bg-solarized-base2 p-2 rounded-lg">
                <MapPin className="w-5 h-5 text-solarized-blue" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-solarized-base02 mb-2">
                  川崎市給食について
                </h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-solarized-base01">
                  <div>
                    <p className="mb-2">
                      • 栄養価は小学校中学年の基準で表示されています
                    </p>
                    <p className="mb-2">
                      • アレルギー情報は学校にお問い合わせください
                    </p>
                  </div>
                  <div>
                    <p className="mb-2">
                      • 食材の都合により献立が変更になる場合があります
                    </p>
                    <p>• 特別メニュー（⭐）は季節行事や特別企画の献立です</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-solarized-base00">
                    データ提供: 川崎市教育委員会 | アプリ開発:
                    かわさき給食ナビ開発チーム | 最終更新: 2025年8月22日 |
                    お問い合わせ: contact@kawasaki-kyushoku.jp
                  </p>
                </div>
              </div>
            </div>
          </footer>

          {/* 開発環境での更新情報表示 */}
          {process.env.NODE_ENV === 'development' && (
            <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-3 shadow-lg text-xs max-w-xs">
              <h4 className="font-bold mb-2">SWR状態</h4>
              <div className="space-y-1">
                <div>
                  今日:{' '}
                  {app.todayMenu.loading
                    ? 'Loading...'
                    : app.todayMenu.hasData
                      ? 'OK'
                      : 'No Data'}
                </div>
                <div>
                  月間: {app.monthlyMenus.loading ? 'Loading...' : 'OK'}
                </div>
                <div>オンライン: {app.isOnline ? '✅' : '❌'}</div>
                <div>学校: {app.selectedSchool}地区</div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  )
}
