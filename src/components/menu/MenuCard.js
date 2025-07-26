import React, { useState } from 'react';
import { Calendar, Clock, Star, ChefHat, Apple, Utensils, Sparkles, Info } from 'lucide-react';

// 曜日の色分け - ユニバーサルデザイン配慮（色覚障害対応）
const getDayColor = (dayOfWeek) => {
  const colors = {
    '月': 'text-slate-700 bg-slate-100 border-slate-300',
    '火': 'text-blue-700 bg-blue-100 border-blue-300', 
    '水': 'text-teal-700 bg-teal-100 border-teal-300',
    '木': 'text-amber-700 bg-amber-100 border-amber-300',
    '金': 'text-indigo-700 bg-indigo-100 border-indigo-300',
    '土': 'text-purple-700 bg-purple-100 border-purple-300',
    '日': 'text-rose-700 bg-rose-100 border-rose-300'
  };
  return colors[dayOfWeek] || 'text-gray-700 bg-gray-100 border-gray-300';
};

const MenuCard = ({ menu, isToday = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // ✅ 修正: menuを依存配列に追加してReact Hook警告を解決
  const menuItems = React.useMemo(() => {
    if (!menu) return [];
    
    // 新しいデータ構造では menu.items 配列を優先的に使用
    if (menu.menu?.items && Array.isArray(menu.menu.items)) {
      // 牛乳以外のアイテムを取得
      return menu.menu.items.filter(item => item && item.trim() !== 'ぎゅうにゅう');
    }
    
    // フォールバック: 古いデータ構造の場合
    if (!menu.menu?.description) return [];
    
    // まず改行で分割
    const lines = menu.menu.description.split('\n').filter(line => line.trim());
    
    // 各行を全角・半角スペースで分割し、さらに細かく分ける
    const allItems = [];
    lines.forEach(line => {
      // 全角スペースと半角スペースで分割
      const spaceSplit = line.split(/[\s　]+/).filter(item => item.trim());
      spaceSplit.forEach(item => {
        const trimmed = item.trim();
        if (trimmed && trimmed !== 'ぎゅうにゅう') {
          allItems.push(trimmed);
        }
      });
    });
    
    return allItems;
  }, [menu]); // ✅ 修正: menuを依存配列に追加
  
  if (!menu) {
    return (
      <div className="bg-gray-100 rounded-2xl p-6 animate-pulse" role="status" aria-label="読み込み中">
        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      </div>
    );
  }

  const dayColor = getDayColor(menu.dayOfWeek);

  // 日付フォーマット
  const formatDate = (dateStr) => {
    if (!dateStr) return { day: '?', month: '?' };
    
    try {
      const date = new Date(dateStr);
      return {
        day: date.getDate(),
        month: date.getMonth() + 1
      };
    } catch (error) {
      return { day: '?', month: '?' };
    }
  };

  const { day, month } = formatDate(menu.date);

  // 特別メニューかどうか
  const isSpecial = menu.isSpecial || menu.hasSpecialMenu;

  return (
    <article 
      className={`
        ${isToday 
          ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-400' 
          : (menu.dayOfWeek === '土' || menu.dayOfWeek === '日') 
            ? 'bg-yellow-50 border-yellow-300' 
            : 'bg-yellow-50 border-gray-300'
        }
        rounded-2xl shadow-md hover:shadow-lg 
        transition-all duration-300 transform hover:-translate-y-1 
        border-2 overflow-hidden focus-within:ring-4 focus-within:ring-blue-300
        flex flex-col min-h-[420px]
      `}
      role="article"
      aria-label={`${menu.date}の給食献立`}
    >
      {/* ヘッダー部分 */}
      <div className="relative p-6 pb-4 flex-grow">
        {/* 今日のバッジ - 高コントラスト */}
        {isToday && (
          <div className="absolute top-4 left-4">
            <div 
              className="bg-amber-600 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center shadow-lg border-2 border-amber-700"
              role="status"
              aria-label="本日の給食"
            >
              <Sparkles className="w-4 h-4 mr-2" aria-hidden="true" />
              <span>今日の給食</span>
            </div>
          </div>
        )}

        {/* 特別メニューバッジ - 高コントラスト */}
        {isSpecial && (
          <div className={`absolute top-4 ${isToday ? 'right-4' : 'right-4'}`}>
            <div 
              className="bg-orange-600 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center shadow-lg border-2 border-orange-700"
              role="status"
              aria-label="特別メニュー"
            >
              <Star className="w-4 h-4 mr-2" aria-hidden="true" />
              <span>特別メニュー</span>
            </div>
          </div>
        )}

        {/* 日付・曜日表示（一体化） - 高コントラスト・アクセシブル */}
        <div className={`flex items-center mb-6 ${isToday || isSpecial ? 'mt-12' : ''}`}>
          <div 
            className={`
              ${isToday 
                ? 'bg-amber-700 border-amber-800' 
                : 'bg-blue-600 border-gray-600'
              } 
              text-white rounded-xl px-6 py-4 shadow-lg border-2 flex items-center space-x-4
            `}
            role="img"
            aria-label={`${month}月${day}日 ${menu.dayOfWeek}曜日`}
          >
            <div className="text-center">
              
              <div className="text-2xl font-bold">{day}日</div>
            </div>
            <div className="text-base font-bold">
              {menu.dayOfWeek}曜日
            </div>
          </div>
        </div>

        {/* メニュー内容 - アクセシブルな構造 */}
        <div className="mb-4">
          <div className="flex items-center mb-4">
            <ChefHat className="w-5 h-5 text-gray-700 mr-3" aria-hidden="true" />
            <h3 className="text-lg font-bold text-gray-800">メニュー</h3>
          </div>
          
          <ul className="space-y-3" role="list">
            {menuItems.slice(0, isExpanded ? menuItems.length : 3).map((item, index) => (
              <li key={index} className="flex items-start text-base text-gray-800" role="listitem">
                <div className="w-3 h-3 bg-blue-600 rounded-full mr-4 flex-shrink-0 mt-2" aria-hidden="true"></div>
                <span className="leading-relaxed font-bold">{item}</span>
              </li>
            ))}
            
            {/* 牛乳は常に表示 */}
            <li className="flex items-start text-base text-gray-800" role="listitem">
              <div className="w-3 h-3 bg-blue-600 rounded-full mr-4 flex-shrink-0 mt-2" aria-hidden="true"></div>
              <span className="leading-relaxed font-bold">ぎゅうにゅう</span>
            </li>
            
            {menuItems.length > 3 && (
              <li>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-base text-blue-700 hover:text-blue-900 font-bold flex items-center mt-3 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors border-2 border-blue-300 hover:border-blue-500 focus:ring-4 focus:ring-blue-300"
                  aria-expanded={isExpanded}
                  aria-controls="menu-items-list"
                >
                  {isExpanded ? '簡略表示する' : `他${menuItems.length - 3}品目を表示する`}
                  <Info className="w-4 h-4 ml-2" aria-hidden="true" />
                </button>
              </li>
            )}
          </ul>

          {/* 学習ポイント（notes）の表示 - アクセシブル */}
          {menu.notes && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200" role="region" aria-labelledby="learning-point-title">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 mt-1" aria-hidden="true">
                  <span className="text-blue-700 text-sm">📚</span>
                </div>
                <div className="flex-1">
                  <h4 id="learning-point-title" className="text-sm font-bold text-blue-800 mb-2">今日の学習ポイント</h4>
                  <p className="text-sm text-blue-700 leading-relaxed">{menu.notes}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 栄養情報フッター - 高コントラスト・アクセシブル */}
      <footer className="bg-gray-100 px-6 py-5 border-t-2 border-gray-200 mt-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {/* カロリー - 高コントラスト */}
            <div className="flex items-center space-x-3" role="group" aria-labelledby="calorie-label">
              <div className="bg-orange-200 p-3 rounded-lg border-2 border-orange-300" aria-hidden="true">
                <Apple className="w-5 h-5 text-orange-700" />
              </div>
              <div>
                <div id="calorie-label" className="text-xs font-medium text-gray-700">エネルギー</div>
                <div className="text-xl font-bold text-orange-700">
                  {Math.round(menu.nutrition?.energy || 0)}
                  <span className="text-sm ml-1">kcal</span>
                </div>
              </div>
            </div>

            {/* たんぱく質 - 高コントラスト */}
            <div className="flex items-center space-x-3" role="group" aria-labelledby="protein-label">
              <div className="bg-teal-200 p-3 rounded-lg border-2 border-teal-300" aria-hidden="true">
                <Utensils className="w-5 h-5 text-teal-700" />
              </div>
              <div>
                <div id="protein-label" className="text-xs font-medium text-gray-700">たんぱく質</div>
                <div className="text-xl font-bold text-teal-700">
                  {menu.nutrition?.protein || 0}
                  <span className="text-sm ml-1">g</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 追加情報 - アクセシブル */}
        <div className="mt-4 pt-4 border-t-2 border-gray-300 flex items-center justify-between text-sm text-gray-700 font-medium">
          <div className="flex items-center space-x-4">
            <span role="img" aria-label={`${menu.district}地区`}>📍 {menu.district}地区</span>
            {menu.schoolType && <span role="img" aria-label={menu.schoolType}>🏫 {menu.schoolType}</span>}
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4" aria-hidden="true" />
            <time dateTime={menu.date}>{menu.date}</time>
          </div>
        </div>
      </footer>
    </article>
  );
};

export default MenuCard;
