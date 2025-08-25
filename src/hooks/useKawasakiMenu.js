// hooks/useKawasakiMenu.js - 月1回更新最適化版
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import useSWR, { useSWRConfig } from 'swr'
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
export const useTodayMenu = (district = 'A', date, enabled = true) => {
  const targetDate = date || getTodayJST()
  // dateがnullまたはenabledがfalseの場合はSWRを無効化
  const apiUrl = (date !== null && enabled) ? `/api/menu/today?date=${targetDate}&district=${district}` : null

  const { data, error, isLoading, mutate } = useSWR(apiUrl, swrConfig.fetcher, {
    // 🔄 給食データの実態に合わせた設定 - 静的な更新間隔に変更
    refreshInterval: 6 * 60 * 60 * 1000, // 6時間間隔で固定

    // 📱 タブ切り替え時の自動更新を無効化
    revalidateOnFocus: false, // タブ切り替え時の自動更新を停止
    revalidateOnReconnect: true, // ネット復活時
    revalidateIfStale: false, // 古いデータでも許容（月1更新なので）

    // 🚨 エラー処理は簡素化・リトライ無効化
    errorRetryCount: 0, // リトライを無効化（再レンダリング防止）
    errorRetryInterval: false, // リトライ間隔も無効化
    loadingTimeout: 15000, // 15秒でタイムアウト

    // 📊 長期キャッシュ
    dedupingInterval: 30 * 60 * 1000, // 30分間は重複リクエスト防止
  })

  return {
    menu: data,
    loading: isLoading,
    error: error?.message || null,
    refresh: mutate,
    hasData: !!data,
    isEmpty: data === null,

    // 📊 追加情報 - 毎回新しいDateオブジェクト作成を防ぐ
    lastUpdated: data ? data.timestamp || null : null,
    nextCheck: null, // 固定間隔のため次回チェック時刻計算は不要
  }
}

// 📊 月間献立取得（月1回更新最適化版）
export const useMonthlyMenus = (year, month, district = 'A', enabled = true) => {
  const currentDate = new Date()
  const targetYear = year || currentDate.getFullYear()
  let targetMonth = month || currentDate.getMonth() + 1
  
  // 8月の場合は9月分の献立を表示
  if (targetMonth === 8 && targetYear === 2025) {
    targetMonth = 9
  }

  const apiUrl = enabled ? `/api/menu/monthly?year=${targetYear}&month=${targetMonth}&district=${district}` : null

  const { data, error, isLoading, mutate } = useSWR(apiUrl, swrConfig.fetcher, {
    // 🔄 月間データは再レンダリング防止のため更新停止
    refreshInterval: 0, // 自動更新を完全停止

    // 📱 ユーザー操作時のみ更新
    revalidateOnFocus: false, // フォーカス時は更新しない
    revalidateOnReconnect: false, // 再接続時も更新しない
    revalidateIfStale: false, // 古いデータを許容

    // 🚨 エラー処理は最小限・リトライ無効化
    errorRetryCount: 0, // リトライを無効化（再レンダリング防止）
    errorRetryInterval: false, // リトライ間隔も無効化

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

    // 📊 追加情報 - 毎回新しいDateオブジェクト作成を防ぐ
    lastUpdated: data ? data.timestamp || null : null,
    nextCheck: null, // 自動更新停止のため次回チェック時刻は不要
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

  // 月末に翌月データをプリフェッチ（useCallbackでメモ化して再レンダリング防止）
  const prefetchNextMonthIfNeeded = useCallback(district => {
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
  }, [mutate])

  // 手動プリフェッチ（ユーザーが明示的に要求した場合）
  const manualPrefetch = useCallback((district, targetDate) => {
    const apiUrl = `/api/menu/today?date=${targetDate}&district=${district}`
    return mutate(apiUrl, undefined, { revalidate: true })
  }, [mutate])

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
export function useKawasakiMenuApp(enabled = true) {
  const { selectedSchool, updateSchool, isLoaded } = useSchoolSelection()
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1

  const todayMenu = useTodayMenu(selectedSchool, null, enabled)
  const monthlyMenus = useMonthlyMenus(
    currentYear,
    currentMonth,
    selectedSchool,
    enabled
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

  // 月末のプリフェッチ（アプリ起動時）- 削除（10秒後のリクエスト防止）
  // useEffect(() => {
  //   if (isLoaded && isOnline && selectedSchool) {
  //     const timer = setTimeout(() => {
  //       prefetchNextMonthIfNeeded(selectedSchool)
  //     }, 10000) // 10秒後に実行
  //     return () => clearTimeout(timer)
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [isLoaded, isOnline, selectedSchool]) // prefetchNextMonthIfNeeded を依存から除外

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
