import { useState, useEffect } from 'react';
import WaterSpotCard from './WaterSpotCard';
import WaterSpotDetail from './WaterSpotDetail';

export default function WaterSpotList({ spots, loading, error, userLocation, onLocationRequest }) {
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [sortBy, setSortBy] = useState('name');

  const sortedSpots = [...spots].sort((a, b) => {
    switch (sortBy) {
      case 'distance':
        if (!a.distance || !b.distance) return 0;
        return a.distance - b.distance;
      case 'ward':
        return a.ward.localeCompare(b.ward);
      case 'category':
        return a.category.localeCompare(b.category);
      case 'name':
      default:
        return a.name.localeCompare(b.name);
    }
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="animate-pulse bg-solarized-base2 border border-solarized-base02 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-solarized-base01 rounded"></div>
              <div className="h-4 bg-solarized-base01 rounded w-48"></div>
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="h-3 bg-solarized-base01 rounded w-16"></div>
                <div className="h-3 bg-solarized-base01 rounded w-20"></div>
              </div>
              <div className="h-3 bg-solarized-base01 rounded w-full"></div>
              <div className="h-3 bg-solarized-base01 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-solarized-red bg-opacity-10 border border-solarized-red rounded-lg p-4 text-center">
        <p className="text-solarized-red mb-2">エラーが発生しました</p>
        <p className="text-sm text-solarized-base00">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-solarized-base01 font-medium">
            {spots.length}件のスポット
          </span>
          {!userLocation && (
            <button
              onClick={onLocationRequest}
              className="text-xs bg-solarized-orange text-solarized-base3 px-2 py-1 rounded hover:bg-opacity-80 transition-colors"
            >
              現在地から距離を表示
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="text-sm text-solarized-base01">
            並び順:
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-2 py-1 text-sm border border-solarized-base02 rounded bg-solarized-base3 text-solarized-base01 focus:ring-1 focus:ring-solarized-blue"
          >
            <option value="name">名前順</option>
            <option value="ward">区順</option>
            <option value="category">カテゴリ順</option>
            {userLocation && <option value="distance">距離順</option>}
          </select>
        </div>
      </div>

      <div className="grid gap-4">
        {sortedSpots.map((spot) => (
          <WaterSpotCard
            key={spot.id}
            spot={spot}
            onClick={setSelectedSpot}
            showDistance={Boolean(userLocation)}
          />
        ))}
      </div>

      {spots.length === 0 && (
        <div className="text-center py-8">
          <span className="text-4xl mb-4 block">🚰</span>
          <p className="text-solarized-base00">該当するスポットが見つかりませんでした</p>
          <p className="text-sm text-solarized-base00 mt-1">フィルター条件を変更してお試しください</p>
        </div>
      )}

      {selectedSpot && (
        <WaterSpotDetail
          spot={selectedSpot}
          onClose={() => setSelectedSpot(null)}
        />
      )}
    </div>
  );
}