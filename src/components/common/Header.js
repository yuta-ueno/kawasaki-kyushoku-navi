import React from 'react';
import { ChefHat, MapPin, Calendar, Bell } from 'lucide-react';

const Header = ({ selectedDistrict, setSelectedDistrict }) => {
  const districts = [
    { 
      id: 'A', 
      name: '川崎区・中原区', 
      shortName: '川崎・中原区',
      description: '北部給食センター', 
      area: '川崎区・中原区' 
    },
    { 
      id: 'B', 
      name: '幸区・多摩区・麻生区', 
      shortName: '幸・多摩・麻生区',
      description: '中部給食センター', 
      area: '幸区・多摩区・麻生区' 
    },
    { 
      id: 'C', 
      name: '高津区・宮前区', 
      shortName: '高津・宮前区',
      description: '南部給食センター', 
      area: '高津区・宮前区' 
    }
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* ロゴ・タイトル */}
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            <div className="bg-gradient-to-r from-blue-600 to-green-600 p-1.5 sm:p-2 rounded-xl shadow-md flex-shrink-0">
              <ChefHat className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-xl font-bold text-gray-900 leading-tight truncate">
                かわさき給食ナビ
              </h1>
              <p className="text-xs sm:text-xs text-gray-500 leading-tight hidden sm:block">
                川崎市の給食を、スマホで簡単チェック
              </p>
              <p className="text-xs text-gray-500 leading-tight sm:hidden">
                川崎市の給食情報
              </p>
            </div>
          </div>

          {/* 右側のコントロール */}
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            {/* 現在の日時表示（デスクトップのみ） */}
            <div className="hidden lg:flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date().toLocaleDateString('ja-JP', { 
                  month: 'long', 
                  day: 'numeric',
                  weekday: 'short'
                })}
              </span>
            </div>

            {/* 通知アイコン（将来機能用） */}
            <button className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* サブヘッダー（地区選択 + 選択地区の詳細情報） */}
      <div className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12 sm:h-14">
            {/* 左側：地区選択 */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* 地区選択セレクトボックス */}
              <div className="relative">
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 pr-8 sm:pr-10 text-sm sm:text-base font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm min-w-[160px] sm:min-w-[200px]"
                  aria-label="給食センター地区を選択"
                >
                  {districts.map(district => (
                    <option key={district.id} value={district.id}>
                      {district.shortName}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 sm:px-3 pointer-events-none">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                </div>
              </div>

              {/* 選択中の地区詳細情報 */}
              <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                <span className="font-medium">
                  {districts.find(d => d.id === selectedDistrict)?.description}
                </span>
                <span className="text-gray-400 hidden md:inline">•</span>
                <span className="text-gray-500 hidden md:inline">
                  対象エリア: {districts.find(d => d.id === selectedDistrict)?.area}
                </span>
              </div>
            </div>
            
            {/* 右側：データ提供情報 */}
            <div className="flex items-center space-x-2 sm:space-x-4 text-xs text-gray-500">
              <span className="hidden sm:inline">データ提供: 川崎市教育委員会</span>
              <span className="hidden sm:inline">•</span>
              <span>最終更新: 2025/07/12</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;