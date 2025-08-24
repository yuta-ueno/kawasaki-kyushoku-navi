import kawasakiKuData from '../../../data/kawasaki_ku_water_spots.json';
import nakaharaData from '../../../data/nakahara_water_spots.json';
import takatsuKuData from '../../../data/takatsu_ku_water_spots.json';
import miyamaeKuData from '../../../data/miyamae_ku_water_spots.json';
import tamaKuData from '../../../data/tama_ku_water_spots.json';
import asaoKuData from '../../../data/asao_ku_water_spots.json';
import saiwaiKuData from '../../../data/saiwai_ku_water_spots.json';

const VALID_WARDS = ['全区', '川崎区', '中原区', '高津区', '宮前区', '多摩区', '麻生区', '幸区'];
const VALID_CATEGORIES = ['全て', '市庁舎', '区役所', '市立図書館', 'スポーツ施設', '市民館', '環境学習施設', 'こども文化センター', 'いこいの家', '出張所', '科学館', '博物館', '農業施設', '温水プール', '民間協力店舗', '分館', 'コミュニティ施設', '福祉施設'];

const WARD_DATA_MAP = {
  '川崎区': kawasakiKuData,
  '中原区': nakaharaData,
  '高津区': takatsuKuData,
  '宮前区': miyamaeKuData,
  '多摩区': tamaKuData,
  '麻生区': asaoKuData,
  '幸区': saiwaiKuData
};

function loadWardData(ward) {
  if (!WARD_DATA_MAP[ward]) return { spots: [] };
  return WARD_DATA_MAP[ward];
}

function loadAllWardData() {
  const allData = [];
  for (const ward of Object.keys(WARD_DATA_MAP)) {
    const wardData = loadWardData(ward);
    if (wardData.spots) {
      allData.push(...wardData.spots);
    }
  }
  return allData;
}

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { ward, category, light } = req.query;

    let allSpots = [];
    let lastUpdated = '';

    if (ward && ward !== '全区' && VALID_WARDS.includes(ward)) {
      const wardData = loadWardData(ward);
      allSpots = wardData.spots || [];
      lastUpdated = wardData.updated || '';
    } else {
      allSpots = loadAllWardData();
      lastUpdated = '2025-08-24';
    }

    let filteredSpots = [...allSpots];

    if (category && category !== '全て' && VALID_CATEGORIES.includes(category)) {
      filteredSpots = filteredSpots.filter(spot => spot.category === category);
    }

    if (light === 'true') {
      filteredSpots = filteredSpots.map(spot => ({
        id: spot.id,
        name: spot.name,
        category: spot.category,
        ward: spot.ward,
        address: spot.address,
        location: spot.location,
        hours_summary: getHoursSummary(spot.hours)
      }));
    }

    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json({
      success: true,
      data: {
        spots: filteredSpots,
        total: filteredSpots.length,
        updated: lastUpdated
      },
      cache_ttl: 3600
    });
  } catch (error) {
    console.error('Water spots list error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

function getHoursSummary(hours) {
  if (!hours) return '要確認';
  
  if (hours.mon_fri) {
    return `平日 ${hours.mon_fri}`;
  }
  
  if (hours.mon_sun) {
    return `毎日 ${hours.mon_sun}`;
  }
  
  return hours.type || '要確認';
}