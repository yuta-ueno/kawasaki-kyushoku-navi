import { useEffect } from 'react';
import { useWaterSpotDetail } from '../../hooks/useWaterSpots';
import { getSpotIcon, formatOperatingHours } from '../../utils/waterSpotUtils';

export default function WaterSpotDetail({ spot, onClose }) {
  const { spot: detailSpot, loading, error } = useWaterSpotDetail(spot?.id);
  
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  const displaySpot = detailSpot || spot;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div 
        className="bg-solarized-base3 rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="spot-detail-title"
      >
        <div className="sticky top-0 bg-solarized-base3 border-b border-solarized-base02 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl" role="img" aria-hidden="true">
              {getSpotIcon(displaySpot.category)}
            </span>
            <h2 id="spot-detail-title" className="text-lg font-medium text-solarized-base01">
              詳細情報
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-solarized-base00 hover:text-solarized-base01 hover:bg-solarized-base2 rounded-full transition-colors"
            aria-label="閉じる"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          {loading && (
            <div className="space-y-2">
              <div className="animate-pulse h-4 bg-solarized-base2 rounded w-3/4"></div>
              <div className="animate-pulse h-3 bg-solarized-base2 rounded w-full"></div>
              <div className="animate-pulse h-3 bg-solarized-base2 rounded w-5/6"></div>
            </div>
          )}

          {error && (
            <div className="bg-solarized-red bg-opacity-10 border border-solarized-red rounded p-3 text-sm text-solarized-red">
              詳細情報の取得に失敗しました: {error}
            </div>
          )}

          <div>
            <h3 className="text-lg font-medium text-solarized-base01 mb-2">
              {displaySpot.name}
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="bg-solarized-base2 text-solarized-base01 px-2 py-1 rounded text-sm">
                {displaySpot.ward}
              </span>
              <span className="bg-solarized-cyan bg-opacity-20 text-solarized-cyan px-2 py-1 rounded text-sm">
                {displaySpot.category}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-solarized-base01 mb-1">住所</h4>
              <p className="text-solarized-base00">
                {displaySpot.full_address || `${displaySpot.ward}${displaySpot.address}`}
              </p>
            </div>

            {displaySpot.install_location && (
              <div>
                <h4 className="font-medium text-solarized-base01 mb-1">設置場所</h4>
                <p className="text-solarized-base00">{displaySpot.install_location}</p>
              </div>
            )}

            {displaySpot.hours && (
              <div>
                <h4 className="font-medium text-solarized-base01 mb-1">営業時間</h4>
                <div className="text-solarized-base00 whitespace-pre-line">
                  {formatOperatingHours(displaySpot.hours)}
                </div>
                {displaySpot.hours.notes && (
                  <p className="text-sm text-solarized-base00 mt-1 italic">
                    ※ {displaySpot.hours.notes}
                  </p>
                )}
              </div>
            )}

            {displaySpot.access_info && (
              <div>
                <h4 className="font-medium text-solarized-base01 mb-1">アクセス</h4>
                <p className="text-solarized-base00">{displaySpot.access_info}</p>
              </div>
            )}

            {displaySpot.distanceText && (
              <div>
                <h4 className="font-medium text-solarized-base01 mb-1">現在地からの距離</h4>
                <p className="text-solarized-orange font-medium">{displaySpot.distanceText}</p>
              </div>
            )}
          </div>

          <div className="border-t border-solarized-base02 pt-3 text-xs text-solarized-base00">
            <p>※ 営業時間や設置場所は変更される場合があります。事前にご確認ください。</p>
          </div>
        </div>
      </div>
    </div>
  );
}