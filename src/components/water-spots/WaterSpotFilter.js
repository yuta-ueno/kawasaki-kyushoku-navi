import { WARDS, CATEGORIES } from '../../utils/waterSpotUtils';

export default function WaterSpotFilter({ filters, onFilterChange, className = '' }) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="ward-select" className="block text-sm font-medium text-solarized-base01 mb-2">
            区を選択
          </label>
          <select
            id="ward-select"
            value={filters.ward}
            onChange={(e) => onFilterChange({ ward: e.target.value })}
            className="w-full px-3 py-2 border border-solarized-base02 rounded-md bg-solarized-base3 text-solarized-base01 focus:ring-2 focus:ring-solarized-blue focus:border-solarized-blue"
          >
            {WARDS.map(ward => (
              <option key={ward} value={ward}>
                {ward}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label htmlFor="category-select" className="block text-sm font-medium text-solarized-base01 mb-2">
            カテゴリを選択
          </label>
          <select
            id="category-select"
            value={filters.category}
            onChange={(e) => onFilterChange({ category: e.target.value })}
            className="w-full px-3 py-2 border border-solarized-base02 rounded-md bg-solarized-base3 text-solarized-base01 focus:ring-2 focus:ring-solarized-blue focus:border-solarized-blue"
          >
            {CATEGORIES.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="text-sm text-solarized-base00">
        フィルター適用中: {filters.ward !== '全区' ? filters.ward : ''} {filters.category !== '全て' ? filters.category : ''}
        {filters.ward === '全区' && filters.category === '全て' && 'すべてのスポット'}
      </div>
    </div>
  );
}