import React from 'react';
import { Calendar, Star, Apple, TrendingUp, Users, Clock } from 'lucide-react';

const StatCard = ({ icon: Icon, title, value, subtitle, color, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-solarized-base3 rounded-xl p-6 shadow-md border border-solarized-base1 animate-pulse">
        <div className="flex items-center space-x-3">
          <div className="bg-solarized-base2 p-3 rounded-lg">
            <div className="w-6 h-6 bg-solarized-base1 rounded"></div>
          </div>
          <div className="flex-1">
            <div className="h-4 bg-solarized-base2 rounded w-20 mb-2"></div>
            <div className="h-6 bg-solarized-base2 rounded w-16"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-solarized-base3 rounded-xl p-6 shadow-md border border-solarized-base1 hover:shadow-lg transition-shadow">
      <div className="flex items-center space-x-3">
        <div className={`${color} p-3 rounded-lg`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="text-sm text-solarized-base00 font-medium">{title}</div>
          <div className="text-2xl font-bold text-solarized-base02">{value}</div>
          {subtitle && (
            <div className="text-xs text-solarized-base0 mt-1">{subtitle}</div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatsCards = ({ stats, loading = false }) => {
  // 統計データのデフォルト値
  const {
    totalMenus = 0,
    specialMenus = 0
  } = stats || {};

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      {/* 給食実施日数 */}
      <StatCard
        icon={Calendar}
        title="給食実施日"
        value={`${totalMenus}日`}
        subtitle="7月の給食提供日数"
        color="bg-solarized-base2 text-solarized-blue"
        loading={loading}
      />

      {/* 特別メニュー */}
      <StatCard
        icon={Star}
        title="特別メニュー"
        value={`${specialMenus}日`}
        subtitle="季節行事等"
        color="bg-solarized-base2 text-solarized-yellow"
        loading={loading}
      />
    </div>
  );
};

export default StatsCards;
