import { useState, useEffect } from 'react';
import Head from 'next/head';
import Header from '../components/common/Header';
import WaterSpotFilter from '../components/water-spots/WaterSpotFilter';
import WaterSpotList from '../components/water-spots/WaterSpotList';
import WaterSpotMap from '../components/water-spots/WaterSpotMap';
import WaterSpotDetail from '../components/water-spots/WaterSpotDetail';
import { useWaterSpots } from '../hooks/useWaterSpots';
import { getCurrentPosition } from '../utils/geoUtils';

export default function WaterSpotsPage() {
  const {
    spots,
    loading,
    error,
    filters,
    userLocation,
    updateFilters,
    setLocation,
    clearError
  } = useWaterSpots();

  const [viewMode, setViewMode] = useState('list');
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const handleLocationRequest = async () => {
    try {
      setLocationLoading(true);
      const position = await getCurrentPosition();
      setLocation(position);
    } catch (err) {
      console.error('Location error:', err);
      alert('位置情報を取得できませんでした。ブラウザの設定を確認してください。');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSpotClick = (spot) => {
    setSelectedSpot(spot);
  };

  return (
    <>
      <Head>
        <title>給水スポット | かわさき給食ナビ</title>
        <meta name="description" content="川崎市内の無料給水スポットを地図とリストで検索できます。区役所、図書館、スポーツ施設など便利な給水場所をご案内。" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-solarized-base3">
        <Header />
        
        <main className="container mx-auto px-4 py-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-solarized-base01 mb-2">
                🚰 給水スポット検索
              </h1>
              <p className="text-solarized-base00">
                川崎市内の無料給水スポットを検索できます。外出時の水分補給にご活用ください。
              </p>
            </div>

            <div className="mb-6">
              <WaterSpotFilter
                filters={filters}
                onFilterChange={updateFilters}
                className="mb-4"
              />
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex bg-solarized-base2 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      viewMode === 'list'
                        ? 'bg-solarized-base3 text-solarized-base01 shadow-sm'
                        : 'text-solarized-base00 hover:text-solarized-base01'
                    }`}
                  >
                    📋 リスト表示
                  </button>
                  <button
                    onClick={() => setViewMode('map')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      viewMode === 'map'
                        ? 'bg-solarized-base3 text-solarized-base01 shadow-sm'
                        : 'text-solarized-base00 hover:text-solarized-base01'
                    }`}
                  >
                    🗺️ 地図表示
                  </button>
                </div>

                {!userLocation && (
                  <button
                    onClick={handleLocationRequest}
                    disabled={locationLoading}
                    className="bg-solarized-orange text-solarized-base3 px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {locationLoading ? '取得中...' : '📍 現在地を取得'}
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="mb-6 bg-solarized-red bg-opacity-10 border border-solarized-red rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <p className="text-solarized-red">エラーが発生しました: {error}</p>
                  <button
                    onClick={clearError}
                    className="text-solarized-red hover:text-solarized-red opacity-70 hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {viewMode === 'list' ? (
                <WaterSpotList
                  spots={spots}
                  loading={loading}
                  error={error}
                  userLocation={userLocation}
                  onLocationRequest={handleLocationRequest}
                />
              ) : (
                <WaterSpotMap
                  spots={spots}
                  userLocation={userLocation}
                  onSpotClick={handleSpotClick}
                  className="mb-6"
                />
              )}
            </div>

            <div className="mt-8 text-center text-sm text-solarized-base00">
              <p className="mb-2">※ 営業時間や設置場所は変更される場合があります。</p>
              <p>事前に各施設の公式情報をご確認ください。</p>
            </div>
          </div>
        </main>

        {selectedSpot && (
          <WaterSpotDetail
            spot={selectedSpot}
            onClose={() => setSelectedSpot(null)}
          />
        )}
      </div>
    </>
  );
}