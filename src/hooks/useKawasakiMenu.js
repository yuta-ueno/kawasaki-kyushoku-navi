import { useState, useEffect, useMemo, useCallback } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { swrConfig } from '../lib/swr-config'
import { getTodayJST } from '../lib/validation'

/**
 * 🏫 学校選択管理
 * LocalStorageを使用して選択された学校地区を管理するhook
 * @returns {Object} selectedSchool, updateSchool, isLoaded
 */
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

/**
 * 📅 今日の献立取得（月1回更新最適化版）
 * 指定された地区の今日の献立データを取得
 * @param {string} district - 地区 (A, B, C)
 * @param {string|null} date - 取得する日付 (null の場合は無効化)
 * @returns {Object} menu, loading, error, refresh, hasData, isEmpty, lastUpdated, nextCheck
 */
export const useTodayMenu = (district = 'A', date) => {
  const targetDate = date || getTodayJST()
  // dateがnullの場合のみSWRを無効化（undefinedは有効）
  const apiUrl = date !== null ? `/api/menu/today?date=${targetDate}&district=${district}` : null
  
  // より確実なSWRキー生成
  const swrKey = apiUrl && district ? apiUrl : null

  const { data, error, isLoading, mutate } = useSWR(swrKey, swrConfig.fetcher, {
    refreshInterval: 0,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    revalidateIfStale: false,
    errorRetryCount: 0,
    errorRetryInterval: false,
    loadingTimeout: 15000,
    dedupingInterval: 30 * 60 * 1000
  })

  // APIレスポンス形式を正規化（{success: true, data: {...}} -> {...}）
  const normalizedData = data?.success ? data.data : data

  return {
    menu: normalizedData,
    loading: isLoading,
    error: error?.message || null,
    refresh: mutate,
    hasData: !!normalizedData,
    isEmpty: normalizedData === null,

    lastUpdated: normalizedData?.timestamp || null,
    nextCheck: null
  }
}

/**
 * 📊 月間献立取得（月1回更新最適化版）
 * 指定された年月・地区の月間献立データを取得・加工
 * @param {number} year - 年
 * @param {number} month - 月
 * @param {string} district - 地区 (A, B, C)
 * @returns {Object} menus, loading, error, refresh, calendarData, getMenuByDate, hasMenuOnDate, metadata, totalMenuDays, specialMenuCount, lastUpdated, nextCheck
 */
export const useMonthlyMenus = (year, month, district = 'A') => {
  const currentDate = new Date()
  const targetYear = year || currentDate.getFullYear()
  let targetMonth = month || currentDate.getMonth() + 1
  
  // 8月の場合は9月分の献立を表示
  if (targetMonth === 8 && targetYear === 2025) {
    targetMonth = 9
  }

  const apiUrl = `/api/menu/monthly?year=${targetYear}&month=${targetMonth}&district=${district}`

  const { data, error, isLoading, mutate } = useSWR(apiUrl, swrConfig.fetcher, {
    refreshInterval: 0,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    errorRetryCount: 0,
    errorRetryInterval: false,
    dedupingInterval: 24 * 60 * 60 * 1000
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

    lastUpdated: data?.timestamp || null,
    nextCheck: null
  }
}

/**
 * 🧠 スマートな更新間隔計算
 * 月末・月初は頻繁に、月中は低頻度で更新間隔を計算
 * @param {string} type - 'daily' または 'monthly'
 * @returns {number} 更新間隔（ミリ秒）
 */
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

/**
 * ⏰ 次回チェック時刻の計算
 * 指定されたタイプに応じて次回チェック時刻を計算
 * @param {string} type - 'daily' または 'monthly'
 * @returns {Date} 次回チェック時刻
 */
function getNextCheckTime(type) {
  const now = new Date()
  const interval = getSmartRefreshInterval(type)
  return new Date(now.getTime() + interval)
}

/**
 * 🚀 プリフェッチ機能（最適化版）
 * 月末に翌月データをプリフェッチし、手動プリフェッチ機能を提供
 * @returns {Object} prefetchNextMonthIfNeeded, manualPrefetch
 */
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

/**
 * 📱 オンライン状態検知
 * ブラウザのオンライン状態を監視
 * @returns {boolean} オンライン状態
 */
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

/**
 * 🔄 統合フック（最適化版）
 * アプリ全体で使用する川崎給食データとUI状態を統合管理
 * @returns {Object} selectedSchool, updateSchool, isSchoolLoaded, todayMenu, monthlyMenus, isOnline, isAppReady, isLoading, hasError, lastUpdate, nextCheck
 */
export function useKawasakiMenuApp() {
  const { selectedSchool, updateSchool, isLoaded } = useSchoolSelection()
  const { mutate } = useSWRConfig()
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1

  // 地区切り替え用の一時的な状態を追加
  const [pendingSchool, setPendingSchool] = useState(null)
  const activeSchool = pendingSchool || selectedSchool

  const todayMenu = useTodayMenu(activeSchool)
  const monthlyMenus = useMonthlyMenus(
    currentYear,
    currentMonth,
    activeSchool
  )
  const { prefetchNextMonthIfNeeded } = useMenuPrefetch()
  const isOnline = useOnlineStatus()

  // pendingSchoolが設定されたら、実際の状態更新を行う
  useEffect(() => {
    if (pendingSchool && pendingSchool !== selectedSchool) {
      updateSchool(pendingSchool)
    }
  }, [pendingSchool, selectedSchool, updateSchool])

  // selectedSchoolが更新されたら、pendingをクリア
  useEffect(() => {
    if (pendingSchool && pendingSchool === selectedSchool) {
      setPendingSchool(null)
    }
  }, [pendingSchool, selectedSchool])

  const handleSchoolChange = newSchool => {

    
    // 即座にpendingSchoolを設定（これによりSWRフックが新しい地区で動作開始）
    setPendingSchool(newSchool)
    
    // SWRキャッシュを強制クリア（ブラウザリロードと同等の効果）
    if (isOnline) {
      const todayDate = getTodayJST()
      let targetMonth = currentMonth
      if (currentMonth === 8 && currentYear === 2025) {
        targetMonth = 9
      }
      
      // 関連するすべてのキャッシュキーをクリア
      const cacheKeysToRemove = [
        `/api/menu/today?date=${todayDate}&district=${selectedSchool}`,
        `/api/menu/today?date=${todayDate}&district=${newSchool}`,
        `/api/menu/monthly?year=${currentYear}&month=${targetMonth}&district=${selectedSchool}`,
        `/api/menu/monthly?year=${currentYear}&month=${targetMonth}&district=${newSchool}`
      ]
      

      
      // キャッシュをクリア（データは残さない）
      cacheKeysToRemove.forEach(key => {
        mutate(key, undefined, { revalidate: false })
      })
      
      // 短い遅延後に新しいキーで強制データ取得
      setTimeout(() => {
        const newTodayKey = `/api/menu/today?date=${todayDate}&district=${newSchool}`
        const newMonthlyKey = `/api/menu/monthly?year=${currentYear}&month=${targetMonth}&district=${newSchool}`
        

        
        mutate(newTodayKey, undefined, { revalidate: true })
        mutate(newMonthlyKey, undefined, { revalidate: true })
      }, 50)
    }
    

  }



  return {
    selectedSchool: activeSchool,
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
