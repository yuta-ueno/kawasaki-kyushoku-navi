export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

export function formatDistance(distance) {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
}

export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 600000
      }
    );
  });
}

export function addDistanceToSpots(spots, userLocation) {
  if (!userLocation) return spots;

  return spots.map(spot => ({
    ...spot,
    distance: calculateDistance(
      userLocation.lat,
      userLocation.lon,
      spot.location.lat,
      spot.location.lon
    ),
    distanceText: formatDistance(calculateDistance(
      userLocation.lat,
      userLocation.lon,
      spot.location.lat,
      spot.location.lon
    ))
  })).sort((a, b) => a.distance - b.distance);
}

export const KAWASAKI_BOUNDS = {
  north: 35.65,
  south: 35.45,
  east: 139.85,
  west: 139.45,
  center: {
    lat: 35.55,
    lon: 139.65
  }
};