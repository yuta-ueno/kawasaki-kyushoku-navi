import React, { useState } from 'react';
import { Calendar, Clock, Star, ChefHat, Apple, Utensils, Sparkles } from 'lucide-react';

// 曜日の色分け - ユニバーサルデザイン配慮（色覚障害対応）
const getDayColor = (dayOfWeek) => {
  const colors = {
    '月': 'text-solarized-base02 bg-solarized-base2 border-solarized-base1',
    '火': 'text-solarized-blue bg-solarized-base2 border-solarized-base1', 
    '水': 'text-solarized-cyan bg-solarized-base2 border-solarized-base1',
    '木': 'text-solarized-yellow bg-solarized-base2 border-solarized-base1',
    '金': 'text-solarized-violet bg-solarized-base2 border-solarized-base1',
    '土': 'text-solarized-magenta bg-solarized-base2 border-solarized-base1',
    '日': 'text-solarized-red bg-solarized-base2 border-solarized-base1'
  };
  return colors[dayOfWeek] || 'text-solarized-base01 bg-solarized-base2 border-solarized-base1';
};

const MenuCard = ({ menu, isToday = false }) => {
  
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
      <div className="bg-solarized-base2 rounded-2xl p-6 animate-pulse" role="status" aria-label="読み込み中">
        <div className="h-4 bg-solarized-base1 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-solarized-base1 rounded w-1/2"></div>
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
          ? 'bg-gradient-to-br from-solarized-base3 to-solarized-base3 border-solarized-yellow' 
          : (menu.dayOfWeek === '土' || menu.dayOfWeek === '日') 
            ? 'bg-solarized-base3 border-solarized-yellow' 
            : 'bg-solarized-base3 border-solarized-base1'
        }
        rounded-2xl shadow-md hover:shadow-lg 
        transition-all duration-300 transform hover:-translate-y-1 
        border-2 overflow-hidden focus-within:ring-4 focus-within:ring-solarized-blue
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
              className="bg-solarized-yellow text-solarized-base3 px-4 py-2 rounded-full text-sm font-bold flex items-center shadow-lg border-2 border-solarized-yellow"
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
              className="bg-solarized-orange text-solarized-base3 px-4 py-2 rounded-full text-sm font-bold flex items-center shadow-lg border-2 border-solarized-orange"
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
                ? 'bg-solarized-yellow border-solarized-yellow' 
                : 'bg-solarized-blue border-solarized-blue'
              } 
              text-solarized-base3 rounded-xl px-6 py-4 shadow-lg border-2 flex items-center space-x-4
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
            <ChefHat className="w-5 h-5 text-solarized-base01 mr-3" aria-hidden="true" />
            <h3 className="text-lg font-bold text-solarized-base02">メニュー</h3>
          </div>
          
          <ul className="space-y-3" role="list">
            {menuItems.map((item, index) => (
              <li key={index} className="flex items-start text-base text-solarized-base02" role="listitem">
                <div className="w-3 h-3 bg-solarized-blue rounded-full mr-4 flex-shrink-0 mt-2" aria-hidden="true"></div>
                <span className="leading-relaxed font-bold">{item}</span>
              </li>
            ))}
            
            {/* 牛乳は常に表示 */}
            <li className="flex items-start text-base text-solarized-base02" role="listitem">
              <div className="w-3 h-3 bg-solarized-blue rounded-full mr-4 flex-shrink-0 mt-2" aria-hidden="true"></div>
              <span className="leading-relaxed font-bold">ぎゅうにゅう</span>
            </li>
          </ul>

          {/* 学習ポイント（notes）の表示 - アクセシブル */}
          {menu.notes && (
            <div className="mt-6 p-4 bg-solarized-base2 rounded-lg border-2 border-solarized-base1" role="region" aria-labelledby="learning-point-title">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-solarized-base1 rounded-full flex items-center justify-center flex-shrink-0 mt-1" aria-hidden="true">
                  <span className="text-solarized-blue text-sm">📚</span>
                </div>
                <div className="flex-1">
                  <h4 id="learning-point-title" className="text-sm font-bold text-solarized-blue mb-2">今日の学習ポイント</h4>
                  <p className="text-sm text-solarized-blue leading-relaxed">{menu.notes}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 栄養情報フッター - 高コントラスト・アクセシブル */}
      <footer className="bg-solarized-base2 px-6 py-5 border-t-2 border-solarized-base1 mt-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {/* カロリー - 高コントラスト */}
            <div className="flex items-center space-x-3" role="group" aria-labelledby="calorie-label">
              <div className="bg-solarized-orange p-3 rounded-lg border-2 border-solarized-orange" aria-hidden="true">
                <Apple className="w-5 h-5 text-solarized-base3" />
              </div>
              <div>
                <div id="calorie-label" className="text-xs font-medium text-solarized-base01">エネルギー</div>
                <div className="text-xl font-bold text-solarized-orange">
                  {Math.round(menu.nutrition?.energy || 0)}
                  <span className="text-sm ml-1">kcal</span>
                </div>
              </div>
            </div>

            {/* たんぱく質 - 高コントラスト */}
            <div className="flex items-center space-x-3" role="group" aria-labelledby="protein-label">
              <div className="bg-solarized-cyan p-3 rounded-lg border-2 border-solarized-cyan" aria-hidden="true">
                <Utensils className="w-5 h-5 text-solarized-base3" />
              </div>
              <div>
                <div id="protein-label" className="text-xs font-medium text-solarized-base01">たんぱく質</div>
                <div className="text-xl font-bold text-solarized-cyan">
                  {menu.nutrition?.protein || 0}
                  <span className="text-sm ml-1">g</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </footer>
    </article>
  );
};

export default MenuCard;
