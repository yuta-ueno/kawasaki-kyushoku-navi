import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { getSpotIcon } from '../../utils/waterSpotUtils';
import { KAWASAKI_BOUNDS } from '../../utils/geoUtils';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });

export default function WaterSpotMap({ spots, userLocation, onSpotClick, className = '' }) {
  const [map, setMap] = useState(null);
  const [L, setL] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet').then((leaflet) => {
        setL(leaflet.default);
        
        // Leafletのデフォルトアイコンを設定
        delete leaflet.default.Icon.Default.prototype._getIconUrl;
        leaflet.default.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
      });
    }
  }, []);

  useEffect(() => {
    if (map && spots.length > 0) {
      const group = L?.featureGroup(spots.map(spot => 
        L.marker([spot.location.lat, spot.location.lon])
      ));
      
      if (group && userLocation) {
        group.addLayer(L.marker([userLocation.lat, userLocation.lon]));
      }
      
      if (group) {
        map.fitBounds(group.getBounds().pad(0.1));
      }
    }
  }, [map, spots, userLocation, L]);

  const createCustomIcon = (category, isUser = false) => {
    if (!L) return null;
    
    if (isUser) {
      // ユーザー位置は赤いマーカー
      return L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });
    }
    
    // 施設は青いマーカーで統一
    return L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  };

  if (!L) {
    return (
      <div className={`bg-solarized-base2 border border-solarized-base02 rounded-lg p-8 text-center ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-solarized-base01 rounded w-24 mx-auto mb-2"></div>
          <div className="h-3 bg-solarized-base01 rounded w-32 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <style jsx global>{`
        .leaflet-container {
          height: 400px;
          border-radius: 8px;
          z-index: 1;
        }
        
        .leaflet-marker-icon {
          transition: all 0.3s ease;
        }
        
        .leaflet-marker-icon:hover {
          transform: scale(1.1);
        }
        
        
        @media (max-width: 640px) {
          .leaflet-container {
            height: 300px;
          }
        }
      `}</style>

      <MapContainer
        center={[KAWASAKI_BOUNDS.center.lat, KAWASAKI_BOUNDS.center.lon]}
        zoom={12}
        className="w-full h-96 sm:h-[400px] rounded-lg border border-solarized-base02"
        whenCreated={setMap}
      >
        <TileLayer
          url="https://tile.openstreetmap.jp/{z}/{x}/{y}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, © <a href="https://openstreetmap.jp/">OpenStreetMap Japan</a>'
          maxZoom={18}
        />
        
        {spots.map((spot) => (
          <Marker
            key={spot.id}
            position={[spot.location.lat, spot.location.lon]}
            icon={createCustomIcon(spot.category)}
            eventHandlers={{
              click: () => onSpotClick?.(spot),
            }}
          />
        ))}
        
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lon]}
            icon={createCustomIcon(null, true)}
          />
        )}
      </MapContainer>

      {spots.length === 0 && (
        <div className="absolute inset-0 bg-solarized-base3 bg-opacity-90 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <span className="text-4xl mb-2 block">🗺️</span>
            <p className="text-solarized-base00">表示するスポットがありません</p>
          </div>
        </div>
      )}
    </div>
  );
}