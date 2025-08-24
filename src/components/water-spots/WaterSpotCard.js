import { getSpotIcon, formatOperatingHours, isSpotOpen } from '../../utils/waterSpotUtils';

export default function WaterSpotCard({ spot, onClick, showDistance = false }) {
  const spotOpen = isSpotOpen(spot.hours);
  
  return (
    <div 
      className="bg-solarized-base3 border border-solarized-base02 rounded-lg p-4 cursor-pointer hover:bg-solarized-base2 hover:border-solarized-blue transition-colors duration-200"
      onClick={() => onClick?.(spot)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(spot);
        }
      }}
      aria-label={`${spot.name}の詳細を表示`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg" role="img" aria-hidden="true">
            {getSpotIcon(spot.category)}
          </span>
          <h3 className="font-medium text-solarized-base01 text-sm sm:text-base">
            {spot.name}
          </h3>
        </div>
        
        {spotOpen !== null && (
          <span className={`text-xs px-2 py-1 rounded-full ${
            spotOpen 
              ? 'bg-solarized-green text-solarized-base3' 
              : 'bg-solarized-red text-solarized-base3'
          }`}>
            {spotOpen ? '営業中' : '営業時間外'}
          </span>
        )}
      </div>

      <div className="space-y-1 text-sm text-solarized-base00">
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-solarized-base2 text-solarized-base01 px-2 py-1 rounded text-xs">
            {spot.ward}
          </span>
          <span className="bg-solarized-cyan bg-opacity-20 text-solarized-cyan px-2 py-1 rounded text-xs">
            {spot.category}
          </span>
        </div>
        
        <p>{spot.address}</p>
        
        {spot.install_location && (
          <p className="text-solarized-base00">
            <span className="font-medium">設置場所:</span> {spot.install_location}
          </p>
        )}
        
        {spot.hours_summary && (
          <p className="text-solarized-base00">
            <span className="font-medium">営業時間:</span> {spot.hours_summary}
          </p>
        )}
        
        {showDistance && spot.distanceText && (
          <div className="flex items-center gap-1 mt-2">
            <span className="text-solarized-orange text-sm">📍</span>
            <span className="text-solarized-orange font-medium">{spot.distanceText}</span>
          </div>
        )}
      </div>
    </div>
  );
}