export const CACHE_KEYS = {
  LIGHT_DATA: 'water_spots_light_v2',
  DETAIL_DATA: 'water_spots_detail_v2_',
  USER_LOCATION: 'user_location',
  FILTER_SETTINGS: 'water_spots_filter_v2'
};

export const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000;

export const WARDS = ['全区', '川崎区', '中原区', '高津区', '宮前区', '多摩区', '麻生区', '幸区'];
export const CATEGORIES = ['全て', '市庁舎', '区役所', '市立図書館', 'スポーツ施設', '市民館', '環境学習施設', 'こども文化センター', 'いこいの家', '出張所', '科学館', '博物館', '農業施設', '温水プール', '民間協力店舗', '分館', 'コミュニティ施設', '福祉施設'];

export function setCacheData(key, data) {
  try {
    const cacheItem = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + CACHE_EXPIRY
    };
    localStorage.setItem(key, JSON.stringify(cacheItem));
  } catch (error) {
    console.warn('Failed to save to cache:', error);
  }
}

export function getCacheData(key) {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const cacheItem = JSON.parse(cached);
    
    if (Date.now() > cacheItem.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    
    return cacheItem.data;
  } catch (error) {
    console.warn('Failed to read from cache:', error);
    return null;
  }
}

export function clearCache() {
  try {
    Object.values(CACHE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('water_spots_detail_')) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('Failed to clear cache:', error);
  }
}

export function formatOperatingHours(hours) {
  if (!hours) return '営業時間要確認';
  
  const parts = [];
  
  if (hours.mon_fri) {
    parts.push(`平日: ${hours.mon_fri}`);
  }
  
  if (hours.sat) {
    parts.push(`土曜: ${hours.sat}`);
  }
  
  if (hours.sun_hol) {
    parts.push(`日祝: ${hours.sun_hol}`);
  }
  
  if (hours.mon_sun) {
    parts.push(`毎日: ${hours.mon_sun}`);
  }
  
  if (hours.closed) {
    parts.push(`休業: ${hours.closed}`);
  }
  
  return parts.length > 0 ? parts.join('\n') : hours.type || '営業時間要確認';
}

export function getSpotIcon(category) {
  const iconMap = {
    '市庁舎': '🏛️',
    '区役所': '🏢',
    '市立図書館': '📚',
    'スポーツ施設': '🏃',
    '市民館': '🏫',
    '環境学習施設': '🌱',
    'こども文化センター': '🎨',
    'いこいの家': '🏠',
    '出張所': '🏢',
    '科学館': '🔬',
    '博物館': '🏛️',
    '農業施設': '🌾',
    '温水プール': '🏊',
    '民間協力店舗': '🛍️',
    '分館': '🏢',
    'コミュニティ施設': '🤝',
    '福祉施設': '❤️'
  };
  
  return iconMap[category] || '🚰';
}

export function isSpotOpen(hours) {
  if (!hours) return null;
  
  const now = new Date();
  const day = now.getDay();
  const currentTime = now.getHours() * 100 + now.getMinutes();
  
  let todayHours = null;
  
  if (day >= 1 && day <= 5 && hours.mon_fri) {
    todayHours = hours.mon_fri;
  } else if (day === 6 && hours.sat) {
    todayHours = hours.sat;
  } else if (day === 0 && hours.sun_hol) {
    todayHours = hours.sun_hol;
  } else if (hours.mon_sun) {
    todayHours = hours.mon_sun;
  }
  
  if (!todayHours || todayHours.includes('要確認')) {
    return null;
  }
  
  const timeMatch = todayHours.match(/(\d{2}):(\d{2})-(\d{2}):(\d{2})/);
  if (!timeMatch) return null;
  
  const openTime = parseInt(timeMatch[1]) * 100 + parseInt(timeMatch[2]);
  const closeTime = parseInt(timeMatch[3]) * 100 + parseInt(timeMatch[4]);
  
  return currentTime >= openTime && currentTime <= closeTime;
}