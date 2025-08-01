import React from 'react';
import { ChefHat, Loader2 } from 'lucide-react';

const Loading = ({ message = '読み込み中...', size = 'medium' }) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          container: 'py-4',
          spinner: 'h-6 w-6',
          icon: 'w-5 h-5',
          text: 'text-sm'
        };
      case 'large':
        return {
          container: 'py-16',
          spinner: 'h-12 w-12',
          icon: 'w-8 h-8',
          text: 'text-lg'
        };
      default:
        return {
          container: 'py-8',
          spinner: 'h-8 w-8',
          icon: 'w-6 h-6',
          text: 'text-base'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <div className={`flex flex-col items-center justify-center ${sizeClasses.container}`}>
      {/* アニメーション付きアイコン */}
      <div className="relative mb-4">
        {/* 回転する外側のリング */}
        <div className={`${sizeClasses.spinner} border-4 border-solarized-base2 border-t-solarized-blue rounded-full animate-spin`}></div>
        
        {/* 中央のシェフハットアイコン */}
        <div className="absolute inset-0 flex items-center justify-center">
          <ChefHat className={`${sizeClasses.icon} text-solarized-blue animate-pulse`} />
        </div>
      </div>

      {/* ローディングメッセージ */}
      <div className={`${sizeClasses.text} text-solarized-base01 font-medium animate-pulse`}>
        {message}
      </div>

      {/* サブメッセージ */}
      <div className="text-xs text-solarized-base0 mt-2 text-center max-w-sm">
        Firestoreから最新の給食データを取得しています...
      </div>
    </div>
  );
};

// スケルトンローディング（カード用）
export const MenuCardSkeleton = () => {
  return (
    <div className="bg-solarized-base3 rounded-2xl shadow-lg border border-solarized-base1 overflow-hidden animate-pulse">
      {/* ヘッダー部分 */}
      <div className="p-6 pb-4">
        {/* 日付・曜日部分 */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-solarized-base1 rounded-xl w-16 h-12"></div>
          <div className="bg-solarized-base1 rounded-lg w-20 h-8"></div>
        </div>

        {/* メニュー内容 */}
        <div className="mb-4">
          <div className="bg-solarized-base1 rounded w-24 h-4 mb-3"></div>
          <div className="space-y-2">
            <div className="bg-solarized-base2 rounded w-full h-4"></div>
            <div className="bg-solarized-base2 rounded w-3/4 h-4"></div>
            <div className="bg-solarized-base2 rounded w-5/6 h-4"></div>
          </div>
        </div>
      </div>

      {/* フッター部分 */}
      <div className="bg-solarized-base2 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="bg-solarized-base1 rounded-lg w-8 h-8"></div>
              <div>
                <div className="bg-solarized-base1 rounded w-12 h-3 mb-1"></div>
                <div className="bg-solarized-base1 rounded w-16 h-4"></div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="bg-solarized-base1 rounded-lg w-8 h-8"></div>
              <div>
                <div className="bg-solarized-base1 rounded w-16 h-3 mb-1"></div>
                <div className="bg-solarized-base1 rounded w-12 h-4"></div>
              </div>
            </div>
          </div>
          <div className="bg-solarized-base1 rounded-full w-16 h-6"></div>
        </div>
      </div>
    </div>
  );
};

// 複数のカードローディング
export const MenuListSkeleton = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: count }, (_, index) => (
        <MenuCardSkeleton key={index} />
      ))}
    </div>
  );
};

export default Loading;
