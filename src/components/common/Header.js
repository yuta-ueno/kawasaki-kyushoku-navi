import React, { useState } from 'react';
import { ChefHat, MapPin, Calendar, Bell, X, AlertTriangle, Star, Info } from 'lucide-react';

// お知らせポップアップコンポーネント
const NotificationPopup = ({ isOpen, onClose }) => {
  const [notifications] = useState([
    {
      id: 1,
      type: 'maintenance',
      title: 'メンテナンス完了のお知らせ',
      message: 'システムメンテナンスが完了しました。より快適にご利用いただけるよう改善を行いました。',
      date: '2025-07-22',
      isNew: true
    },
    {
      id: 2,
      type: 'important',
      title: '夏季休業中の給食について',
      message: '7月18日（金）で夏休み前の給食は終了しました。',
      date: '2025-07-18',
      isNew: false
    },
    {
      id: 3,
      type: 'update',
      title: 'アプリリリース（テスト版）',
      message: 'かわさき給食ナビの運用テストバージョンを公開しました。',
      date: '2025-07-10',
      isNew: false
    }
  ]);

  // アイコンとスタイルの設定
  const getNotificationStyle = (type) => {
    switch (type) {
      case 'important':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-500',
          titleColor: 'text-red-800'
        };
      case 'update':
        return {
          icon: Star,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-500',
          titleColor: 'text-blue-800'
        };
      case 'event':
        return {
          icon: Calendar,
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          iconColor: 'text-purple-500',
          titleColor: 'text-purple-800'
        };
      default:
        return {
          icon: Info,
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          iconColor: 'text-gray-500',
          titleColor: 'text-gray-800'
        };
    }
  };

  // 日付のフォーマット
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* オーバーレイ */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300"
        onClick={onClose}
      ></div>

      {/* ポップアップ本体 */}
      <div className="fixed inset-4 md:inset-8 lg:left-1/4 lg:right-1/4 lg:top-16 lg:bottom-16 bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-6 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Bell className="w-6 h-6" />
            <h2 className="text-xl font-bold">お知らせ</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* コンテンツエリア */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {notifications.map((notification) => {
              const style = getNotificationStyle(notification.type);
              const IconComponent = style.icon;

              return (
                <div
                  key={notification.id}
                  className={`p-4 rounded-xl border-2 ${style.bgColor} ${style.borderColor} transition-all duration-200 hover:shadow-md`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg bg-white shadow-sm`}>
                      <IconComponent className={`w-5 h-5 ${style.iconColor}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className={`font-semibold ${style.titleColor} text-lg`}>
                          {notification.title}
                        </h3>
                        {notification.isNew && (
                          <span className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
                            NEW
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-700 leading-relaxed mb-3">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(notification.date)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* フッター */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              かわさき給食ナビ開発チーム
            </p>
            <p className="text-xs text-gray-500 mt-1">
              最新情報は川崎市公式サイトでもご確認いただけます
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

const Header = ({ selectedDistrict, setSelectedDistrict }) => {
  // お知らせポップアップの状態管理（追加）
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);

  const districts = [
    { 
      id: 'A', 
      name: '川崎区・中原区', 
      shortName: '川崎・中原区',
      description: 'A地区', 
      area: '川崎区・中原区' 
    },
    { 
      id: 'B', 
      name: '幸区・多摩区・麻生区', 
      shortName: '幸・多摩・麻生区',
      description: 'B地区', 
      area: '幸区・多摩区・麻生区' 
    },
    { 
      id: 'C', 
      name: '高津区・宮前区', 
      shortName: '高津・宮前区',
      description: 'C地区', 
      area: '高津区・宮前区' 
    }
  ];

  return (
    <>
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

              {/* 通知アイコン（機能追加） */}
              <button 
                onClick={() => {
                  setIsNotificationOpen(true);
                  setHasUnreadNotifications(false);
                }}
                className="relative p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {hasUnreadNotifications && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-pulse"></span>
                )}
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

      {/* お知らせポップアップ */}
      <NotificationPopup 
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />
    </>
  );
};

export default Header;