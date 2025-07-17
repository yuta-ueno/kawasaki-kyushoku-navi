import React, { useState } from 'react';
import { Calendar, Clock, Star, ChefHat, Apple, Utensils, Sparkles, Info } from 'lucide-react';

// 曜日の色分け - 目に優しい色に変更
const getDayColor = (dayOfWeek) => {
  const colors = {
    '月': 'text-slate-600 bg-slate-50 border-slate-200',
    '火': 'text-rose-600 bg-rose-50 border-rose-200', 
    '水': 'text-emerald-600 bg-emerald-50 border-emerald-200',
    '木': 'text-amber-600 bg-amber-50 border-amber-200',
    '金': 'text-violet-600 bg-violet-50 border-violet-200',
    '土': 'text-indigo-600 bg-indigo-50 border-indigo-200',
    '日': 'text-rose-600 bg-rose-50 border-rose-200'
  };
  return colors[dayOfWeek] || 'text-gray-600 bg-gray-50 border-gray-200';
};

const MenuCard = ({ menu, isToday = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // メニューアイテムを整理 - React Hookはearly returnの前に配置
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
  }, [menu?.menu?.items, menu?.menu?.description]);
  
  if (!menu) {
    return (
      <div className="bg-slate-100 rounded-2xl p-6 animate-pulse">
        <div className="h-4 bg-slate-300 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-slate-300 rounded w-1/2"></div>
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
    <div className={`
      bg-slate-50 rounded-2xl shadow-md hover:shadow-lg 
      transition-all duration-300 transform hover:-translate-y-1 
      border border-slate-200 overflow-hidden
      ${isToday ? 'ring-2 ring-amber-300 ring-offset-2 bg-gradient-to-br from-amber-50 to-yellow-50' : ''}
    `}>
      {/* ヘッダー部分 */}
      <div className="relative p-6 pb-4">
        {/* 今日のバッジ - 目に優しい色 */}
        {isToday && (
          <div className="absolute top-4 left-4">
            <div className="bg-gradient-to-r from-amber-400 to-orange-400 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center shadow-md">
              <Sparkles className="w-3 h-3 mr-1" />
              今日の給食
            </div>
          </div>
        )}

        {/* 特別メニューバッジ - 目に優しい色 */}
        {isSpecial && (
          <div className={`absolute top-4 ${isToday ? 'right-4' : 'right-4'}`}>
            <div className="bg-gradient-to-r from-yellow-400 to-amber-400 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center shadow-md">
              <Star className="w-3 h-3 mr-1" />
              特別メニュー
            </div>
          </div>
        )}

        {/* 日付表示 - 目に優しい色 */}
        <div className={`flex items-center mb-4 ${isToday || isSpecial ? 'mt-8' : ''}`}>
          <div className="flex items-center space-x-3">
            <div className={`
              ${isToday 
                ? 'bg-gradient-to-br from-amber-500 to-orange-500' 
                : 'bg-gradient-to-br from-slate-500 to-slate-600'
              } 
              text-white rounded-xl px-4 py-2 shadow-md
            `}>
              <div className="text-center">
                <div className="text-xs font-medium opacity-90">{month}月</div>
                <div className="text-xl font-bold">{day}</div>
              </div>
            </div>
            <div className={`px-3 py-2 rounded-lg font-semibold text-sm border ${dayColor}`}>
              {menu.dayOfWeek}曜日
            </div>
          </div>
        </div>

        {/* メニュー内容 */}
        <div className="mb-4">
          <div className="flex items-center mb-3">
            <ChefHat className="w-4 h-4 text-slate-500 mr-2" />
            <span className="text-sm font-semibold text-slate-700">メニュー</span>
          </div>
          
          <div className="space-y-2">
            {menuItems.slice(0, isExpanded ? menuItems.length : 3).map((item, index) => (
              <div key={index} className="flex items-start text-sm text-slate-700">
                <div className="w-2 h-2 bg-slate-400 rounded-full mr-3 flex-shrink-0 mt-2"></div>
                <span className="leading-relaxed">{item}</span>
              </div>
            ))}
            
            {/* 牛乳は常に表示（データから取得または固定表示） */}
            <div className="flex items-start text-sm text-slate-700">
              <div className="w-2 h-2 bg-slate-400 rounded-full mr-3 flex-shrink-0 mt-2"></div>
              <span className="leading-relaxed">ぎゅうにゅう</span>
            </div>
            
            {menuItems.length > 3 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-slate-600 hover:text-slate-800 font-medium flex items-center mt-2 hover:bg-slate-100 px-2 py-1 rounded transition-colors"
              >
                {isExpanded ? '簡略表示' : `他${menuItems.length - 3}品目を表示`}
                <Info className="w-3 h-3 ml-1" />
              </button>
            )}
          </div>

          {/* 学習ポイント（notes）の表示 - 目に優しい色 */}
          {menu.notes && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-start space-x-2">
                <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-slate-600 text-xs">📚</span>
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-slate-700 mb-1">今日の学習ポイント</div>
                  <div className="text-xs text-slate-600 leading-relaxed">{menu.notes}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 栄養情報フッター - 目に優しい色 */}
      <div className="bg-slate-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* カロリー - 目に優しい色 */}
            <div className="flex items-center space-x-2">
              <div className="bg-amber-100 p-2 rounded-lg">
                <Apple className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <div className="text-xs text-slate-500">エネルギー</div>
                <div className="text-lg font-bold text-amber-600">
                  {Math.round(menu.nutrition?.energy || 0)}
                  <span className="text-xs ml-1">kcal</span>
                </div>
              </div>
            </div>

            {/* たんぱく質 - 目に優しい色 */}
            <div className="flex items-center space-x-2">
              <div className="bg-emerald-100 p-2 rounded-lg">
                <Utensils className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <div className="text-xs text-slate-500">たんぱく質</div>
                <div className="text-lg font-bold text-emerald-600">
                  {menu.nutrition?.protein || 0}
                  <span className="text-xs ml-1">g</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 追加情報 - 目に優しい色 */}
        <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-4">
            <span>📍 {menu.district}地区</span>
            {menu.schoolType && <span>🏫 {menu.schoolType}</span>}
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>{menu.date}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuCard;
