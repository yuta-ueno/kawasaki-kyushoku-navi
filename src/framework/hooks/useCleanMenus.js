/**
 * Framework Hook: Clean Architecture Menu Hook
 * ビジネスロジックとUIを分離したクリーンなフック
 */

import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import { getMenuController } from '../../interface/controllers/MenuController.js';
import { swrConfig } from '../../shared/config/swr-config.js';

/**
 * 今日の給食メニューフック（クリーンアーキテクチャ版）
 */
export function useTodayMenuClean(district, date) {
  const apiUrl = `/api/menu/today?date=${date}&district=${district}`;
  
  const { data, error, isLoading, mutate } = useSWR(
    apiUrl, 
    swrConfig.fetcher,
    {
      refreshInterval: 6 * 60 * 60 * 1000, // 6時間
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      errorRetryCount: 2,
      errorRetryInterval: 5000
    }
  );

  return {
    menu: data?.data || null,
    loading: isLoading,
    error: error || (data && !data.success ? data.error : null),
    refresh: mutate,
    hasData: !!(data?.success && data?.data),
    isEmpty: data?.success === false && data?.error === 'Not found',
    metadata: data?.metadata || null
  };
}

/**
 * 月間給食メニューフック（クリーンアーキテクチャ版）
 */
export function useMonthlyMenusClean(year, month, district) {
  const apiUrl = `/api/menu/monthly?year=${year}&month=${month}&district=${district}`;
  
  const { data, error, isLoading, mutate } = useSWR(
    apiUrl,
    swrConfig.fetcher,
    {
      refreshInterval: 24 * 60 * 60 * 1000, // 24時間
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 24 * 60 * 60 * 1000
    }
  );

  const statistics = data?.data?.statistics || {
    totalMenus: 0,
    specialMenus: 0,
    avgCalories: 0,
    avgProtein: 0
  };

  return {
    menus: data?.data?.menus || [],
    loading: isLoading,
    error: error || (data && !data.success ? data.error : null),
    refresh: mutate,
    statistics,
    total: data?.data?.total || 0,
    metadata: data?.metadata || null
  };
}

/**
 * メニュー統合管理フック（クリーンアーキテクチャ版）
 */
export function useMenuAppClean() {
  const [selectedDistrict, setSelectedDistrict] = useState('A');
  const [isDistrictLoaded, setIsDistrictLoaded] = useState(false);

  // 現在の日付情報
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const today = currentDate.toISOString().split('T')[0];

  // ローカルストレージから地区設定を復元
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kawasaki_selected_district');
      if (saved && ['A', 'B', 'C'].includes(saved)) {
        setSelectedDistrict(saved);
      }
      setIsDistrictLoaded(true);
    }
  }, []);

  // 地区変更ハンドラ
  const updateDistrict = useCallback((district) => {
    setSelectedDistrict(district);
    if (typeof window !== 'undefined') {
      localStorage.setItem('kawasaki_selected_district', district);
    }
  }, []);

  // データフック
  const todayMenu = useTodayMenuClean(selectedDistrict, today);
  const monthlyMenus = useMonthlyMenusClean(currentYear, currentMonth, selectedDistrict);

  // オンライン状態管理
  const [isOnline, setIsOnline] = useState(true);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      
      setIsOnline(navigator.onLine);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  return {
    // State
    selectedDistrict,
    updateDistrict,
    isDistrictLoaded,
    isOnline,

    // Today's menu
    todayMenu: {
      ...todayMenu,
      hasData: todayMenu.hasData,
      isEmpty: todayMenu.isEmpty
    },

    // Monthly menus
    monthlyMenus: {
      ...monthlyMenus,
      hasData: monthlyMenus.menus.length > 0
    },

    // App status
    isAppReady: isDistrictLoaded && (todayMenu.hasData || !isOnline || todayMenu.isEmpty),
    isLoading: todayMenu.loading || monthlyMenus.loading,
    hasError: !!(todayMenu.error || monthlyMenus.error),
    
    // Date info
    currentDate: {
      year: currentYear,
      month: currentMonth,
      today,
      formatted: currentDate.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      })
    }
  };
}

/**
 * メニューインポートフック（管理者用）
 */
export function useMenuImport() {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const importMenus = useCallback(async (menuData) => {
    try {
      setImporting(true);
      setError(null);
      
      const controller = getMenuController();
      const response = await fetch('/api/admin/import-menus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ menuData })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Import failed');
      }

      setResult(result.data);
      return result.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setImporting(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setImporting(false);
  }, []);

  return {
    importMenus,
    importing,
    result,
    error,
    reset
  };
}

/**
 * メニュー検索フック
 */
export function useMenuSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    district: 'A',
    minCalories: null,
    maxCalories: null
  });

  const apiUrl = searchTerm.length >= 2 
    ? `/api/menu/search?searchTerm=${encodeURIComponent(searchTerm)}&district=${filters.district}&minCalories=${filters.minCalories || ''}&maxCalories=${filters.maxCalories || ''}`
    : null;

  const { data, error, isLoading } = useSWR(
    apiUrl,
    swrConfig.fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000 // 30秒
    }
  );

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    filters,
    updateFilters,
    results: data?.data?.menus || [],
    total: data?.data?.total || 0,
    loading: isLoading,
    error: error || (data && !data.success ? data.error : null),
    hasResults: !!(data?.success && data?.data?.menus?.length > 0)
  };
}

export default {
  useTodayMenuClean,
  useMonthlyMenusClean,
  useMenuAppClean,
  useMenuImport,
  useMenuSearch
};