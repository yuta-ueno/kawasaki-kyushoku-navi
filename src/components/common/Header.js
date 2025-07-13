import React from 'react';
import { ChefHat, MapPin, Calendar, Bell } from 'lucide-react';

const Header = ({ selectedDistrict, setSelectedDistrict }) => {
  const districts = [
    { id: 'A', name: 'A地区', description: '北部給食センター' },
    { id: 'B', name: 'B地区', description: '中部給食センター' },
    { id: 'C', name: 'C地区', description: '南部給食センター' }
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* ロゴ・タイトル */}
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-600 to-green-600 p-2 rounded-xl shadow-md">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">
                かわさき給食ナビ
              </h1>
              <p className="text-xs text-gray-500 leading-tight">
                川崎市の給食を、スマホで簡単チェック
              </p>
            </div>
          </div>

          {/* 地区選択・情報 */}
          <div className="flex items-center space-x-4">
            {/* 現在の日時表示 */}
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date().toLocaleDateString('ja-JP', { 
                  month: 'long', 
                  day: 'numeric',
                  weekday: 'short'
                })}
              </span>
            </div>

            {/* 地区選択 */}
            <div className="relative">
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              >
                {districts.map(district => (
                  <option key={district.id} value={district.id}>
                    {district.name} ({district.description})
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <MapPin className="w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* 通知アイコン（将来機能用） */}
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* サブヘッダー（選択地区の詳細情報） */}
      <div className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span className="font-medium">
                  {districts.find(d => d.id === selectedDistrict)?.name}
                </span>
                <span className="text-gray-500">
                  ({districts.find(d => d.id === selectedDistrict)?.description})
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>データ提供: 川崎市教育委員会</span>
              <span>•</span>
              <span>最終更新: 2025/07/12</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
