// hooks/useKawasakiMenu.js - 月1回更新最適化版
import useSWR, { useSWRConfig } from 'swr'
import { useState, useEffect, useMemo } from 'react'
import { swrConfig } from '../lib/swr-config'

// JST基準で今日の日付を取得
const getTodayJST = () => {
  const now = new Date()
  const jstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return jstDate.toISOString().split('T')[0]
}

// 🏫 学校選択管理
export function useSchoolSelection() {
  const [selectedSchool, setSelectedSchool] = useState('A')
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kawasaki_selected_school')
      if (saved && ['A', 'B', 'C', '北部', '中部', '南部'].includes(saved)) {
        setSelectedSchool(saved)
      }
      setIsLoaded(true)
    }
  }, [])

  const updateSchool = school => {
    setSelectedSchool(school)
    if (typeof window !== 'undefined') {
      localStorage.setItem('kawasaki_selected_school', school)
    }
  }

  return { selectedSchool, updateSchool, isLoaded }
}

// 📅 今日の献立取得（月1回更新最適化版）
export const useTodayMenu = (district = 'A', date) => {
  const targetDate = date || getTodayJST()
  const apiUrl = `/api/menu/today?date=${targetDate}&district=${district}`

  const { data, error, isLoading, mutate } = useSWR(apiUrl, swrConfig.fetcher, {
    // 🔄 給食データの実態に合わせた設定
    refreshInterval: 6 * 60 * 60 * 1000, // 6時間間隔（2分 → 6時間）

    // 📱 ユーザー操作時は即座に更新
    revalidateOnFocus: true, // ユーザーがアプリに戻った時
    revalidateOnReconnect: true, // ネット復活時
    revalidateIfStale: false, // 古いデータでも許容（月1更新なので）

    // 🚨 エラー処理は簡素化・長い間隔
    errorRetryCount: 1, // リトライは1回のみ
    errorRetryInterval: 2 * 60 * 1000, // 2分後にリトライ
    loadingTimeout: 15000, // 15秒でタイムアウト

    // 📊 長期キャッシュ
    dedupingInterval: 30 * 60 * 1000, // 30分間は重複リクエスト防止

    // 🎯 月末・月初の更新頻度調整
    refreshInterval: getSmartRefreshInterval('daily'),
  })

  return {
    menu: data,
    loading: isLoading,
    error: error?.message || null,
    refresh: mutate,
    hasData: !!data,
    isEmpty: data === null,

    // 📊 追加情報
    lastUpdated: data ? new Date() : null,
    nextCheck: getNextCheckTime('daily'),
  }
}

// 📊 月間献立取得（月1回更新最適化版）
export const useMonthlyMenus = (year, month, district = 'A') => {
  const currentDate = new Date()
  const targetYear = year || currentDate.getFullYear()
  const targetMonth = month || currentDate.getMonth() + 1

  const apiUrl = `/api/menu/monthly?year=${targetYear}&month=${targetMonth}&district=${district}`

  const { data, error, isLoading, mutate } = useSWR(apiUrl, swrConfig.fetcher, {
    // 🔄 月間データは更新頻度を大幅削減
    refreshInterval: getSmartRefreshInterval('monthly'),

    // 📱 手動更新のみ
    revalidateOnFocus: false, // フォーカス時は更新しない
    revalidateOnReconnect: false, // 再接続時も更新しない
    revalidateIfStale: false, // 古いデータを許容

    // 🚨 エラー処理は最小限・長い間隔
    errorRetryCount: 1,
    errorRetryInterval: 3 * 60 * 1000, // 3分後にリトライ

    // 📊 超長期キャッシュ
    dedupingInterval: 24 * 60 * 60 * 1000, // 24時間は重複リクエスト防止
  })

  const processedData = useMemo(() => {
    if (!data) {
      return {
        menus: [],
        calendarData: {},
        menusByDay: {},
        metadata: null,
      }
    }

    // データ形式を安全に処理
    let menusArray = []

    if (Array.isArray(data)) {
      // データが直接配列の場合
      menusArray = data
    } else if (data.data && Array.isArray(data.data)) {
      // API response format: { success: true, data: [...] }
      menusArray = data.data
    } else if (data.menus && Array.isArray(data.menus)) {
      // data.menus が配列の場合
      menusArray = data.menus
    } else if (typeof data === 'object' && data !== null && !data.success) {
      // データが単一オブジェクトの場合は配列に変換（APIレスポンスオブジェクトでない場合のみ）
      menusArray = [data]
    }

    const calendarData = {}
    const menusByDay = {}

    // デバッグ情報（開発環境のみ）
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 月間データ処理:', {
        rawData: data,
        menusArrayLength: menusArray.length,
        menusArrayType: Array.isArray(menusArray) ? 'array' : typeof menusArray,
      })
    }

    menusArray.forEach(menu => {
      if (menu.date) {
        calendarData[menu.date] = {
          hasMenu: true,
          isSpecial: menu.hasSpecialMenu || false,
          dayOfWeek: menu.dayOfWeek,
        }
        menusByDay[menu.date] = menu
      }
    })

    return {
      menus: menusArray,
      calendarData,
      menusByDay,
      metadata: data.metadata || null,
      totalMenuDays: menusArray.length,
      specialMenuCount: menusArray.filter(m => m.hasSpecialMenu).length,
    }
  }, [data])

  return {
    menus: processedData.menus,
    loading: isLoading,
    error: error?.message || null,
    refresh: mutate,
    calendarData: processedData.calendarData,
    getMenuByDate: date => processedData.menusByDay[date] || null,
    hasMenuOnDate: date => !!processedData.calendarData[date]?.hasMenu,
    metadata: processedData.metadata,
    totalMenuDays: processedData.totalMenuDays,
    specialMenuCount: processedData.specialMenuCount,

    // 📊 追加情報
    lastUpdated: data ? new Date() : null,
    nextCheck: getNextCheckTime('monthly'),
  }
}

// 🧠 スマートな更新間隔計算
function getSmartRefreshInterval(type) {
  const now = new Date()
  const dayOfMonth = now.getDate()
  const isEndOfMonth = dayOfMonth >= 25 // 月末近く
  const isBeginningOfMonth = dayOfMonth <= 5 // 月初

  if (type === 'daily') {
    // 月末・月初は少し頻繁に（新しい月の献立公開を検知）
    if (isEndOfMonth || isBeginningOfMonth) {
      return 3 * 60 * 60 * 1000 // 3時間間隔
    }
    // 月中は低頻度
    return 12 * 60 * 60 * 1000 // 12時間間隔
  }

  if (type === 'monthly') {
    // 月末・月初は1日1回
    if (isEndOfMonth || isBeginningOfMonth) {
      return 24 * 60 * 60 * 1000 // 24時間間隔
    }
    // 月中は3日に1回
    return 3 * 24 * 60 * 60 * 1000 // 72時間間隔
  }

  return 24 * 60 * 60 * 1000 // デフォルト24時間
}

// ⏰ 次回チェック時刻の計算
function getNextCheckTime(type) {
  const now = new Date()
  const interval = getSmartRefreshInterval(type)
  return new Date(now.getTime() + interval)
}

// 🚀 プリフェッチ機能（最適化版）
export function useMenuPrefetch() {
  const { mutate } = useSWRConfig()

  // 月末に翌月データをプリフェッチ
  const prefetchNextMonthIfNeeded = district => {
    const now = new Date()
    const dayOfMonth = now.getDate()

    // 月の最後の週のみ実行
    if (dayOfMonth >= 25) {
      const nextMonth = new Date()
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      const year = nextMonth.getFullYear()
      const month = nextMonth.getMonth() + 1

      const apiUrl = `/api/menu/monthly?year=${year}&month=${month}&district=${district}`
      mutate(apiUrl, undefined, { revalidate: true }).catch(() => {})
    }
  }

  // 手動プリフェッチ（ユーザーが明示的に要求した場合）
  const manualPrefetch = (district, targetDate) => {
    const apiUrl = `/api/menu/today?date=${targetDate}&district=${district}`
    return mutate(apiUrl, undefined, { revalidate: true })
  }

  return {
    prefetchNextMonthIfNeeded,
    manualPrefetch,
  }
}

// 📱 オンライン状態検知
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine)
      const handleOnline = () => setIsOnline(true)
      const handleOffline = () => setIsOnline(false)
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [])

  return isOnline
}

// 🔄 統合フック（最適化版）
export function useKawasakiMenuApp() {
  const { selectedSchool, updateSchool, isLoaded } = useSchoolSelection()
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1

  const todayMenu = useTodayMenu(selectedSchool)
  const monthlyMenus = useMonthlyMenus(
    currentYear,
    currentMonth,
    selectedSchool
  )
  const { prefetchNextMonthIfNeeded } = useMenuPrefetch()
  const isOnline = useOnlineStatus()

  const handleSchoolChange = newSchool => {
    updateSchool(newSchool)
    // 月末のみ翌月データをプリフェッチ
    if (isOnline) {
      prefetchNextMonthIfNeeded(newSchool)
    }
  }

  // 月末のプリフェッチ（アプリ起動時）
  useEffect(() => {
    if (isLoaded && isOnline && selectedSchool) {
      const timer = setTimeout(() => {
        prefetchNextMonthIfNeeded(selectedSchool)
      }, 10000) // 10秒後に実行
      return () => clearTimeout(timer)
    }
  }, [isLoaded, isOnline, selectedSchool, prefetchNextMonthIfNeeded])

  return {
    selectedSchool,
    updateSchool: handleSchoolChange,
    isSchoolLoaded: isLoaded,
    todayMenu,
    monthlyMenus,
    isOnline,
    isAppReady: isLoaded && (todayMenu.hasData || !isOnline),
    isLoading: todayMenu.loading || monthlyMenus.loading,
    hasError: !!todayMenu.error || !!monthlyMenus.error,

    // 📊 更新情報
    lastUpdate: {
      today: todayMenu.lastUpdated,
      monthly: monthlyMenus.lastUpdated,
    },
    nextCheck: {
      today: todayMenu.nextCheck,
      monthly: monthlyMenus.nextCheck,
    },
  }
}

// 📊 更新状況の表示コンポーネント（開発環境用）
export function UpdateStatusDisplay() {
  const app = useKawasakiMenuApp()

  if (process.env.NODE_ENV !== 'development') return null

  return (
    <div className="fixed top-4 right-4 bg-white border border-gray-300 rounded-lg p-3 shadow-lg z-50 text-xs">
      <h3 className="font-bold mb-2">📊 更新状況</h3>
      <div className="space-y-1">
        <div>今日: {app.lastUpdate.today ? '取得済み' : '未取得'}</div>
        <div>月間: {app.lastUpdate.monthly ? '取得済み' : '未取得'}</div>
        <div>
          次回チェック: {app.nextCheck.today?.toLocaleTimeString() || '-'}
        </div>
        <div>オンライン: {app.isOnline ? '✅' : '❌'}</div>
      </div>
    </div>
  )
}
