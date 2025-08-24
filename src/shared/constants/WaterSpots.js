/**
 * Shared Constants: Water Spots
 * 給水スポット関連の定数定義
 */

export const WARDS = [
  '全区', '川崎区', '中原区', '高津区', '宮前区', '多摩区', '麻生区', '幸区'
];

export const CATEGORIES = [
  '全て', '市庁舎', '区役所', '市立図書館', 'スポーツ施設', '市民館', 
  '環境学習施設', 'こども文化センター', 'いこいの家', '出張所', 
  '科学館', '博物館', '農業施設', '温水プール', '民間協力店舗', 
  '分館', 'コミュニティ施設', '福祉施設'
];

export const CATEGORY_ICONS = {
  '市庁舎': '🏛️',
  '区役所': '🏢',
  '市立図書館': '📚',
  'スポーツ施設': '🏃',
  '市民館': '🏛️',
  '環境学習施設': '🌿',
  'こども文化センター': '🎨',
  'いこいの家': '🏠',
  '出張所': '🏢',
  '科学館': '🔬',
  '博物館': '🏺',
  '農業施設': '🌾',
  '温水プール': '🏊',
  '民間協力店舗': '🏪',
  '分館': '📚',
  'コミュニティ施設': '🏘️',
  '福祉施設': '🏥'
};

export const CACHE_KEYS = {
  LIGHT_DATA: 'water_spots_light',
  DETAIL_DATA: 'water_spot_detail_',
  FILTER_SETTINGS: 'water_spot_filters',
  USER_LOCATION: 'user_location'
};

export const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

export const KAWASAKI_BOUNDS = {
  north: 35.6500,
  south: 35.4500,
  east: 139.7500,
  west: 139.5000
};

export const DEFAULT_FILTERS = {
  ward: '全区',
  category: '全て'
};

export const isValidWard = (ward) => {
  return WARDS.includes(ward);
};

export const isValidCategory = (category) => {
  return CATEGORIES.includes(category);
};

export const getCategoryIcon = (category) => {
  return CATEGORY_ICONS[category] || '🚰';
};

export default {
  WARDS,
  CATEGORIES,
  CATEGORY_ICONS,
  CACHE_KEYS,
  CACHE_EXPIRY,
  KAWASAKI_BOUNDS,
  DEFAULT_FILTERS,
  isValidWard,
  isValidCategory,
  getCategoryIcon
};