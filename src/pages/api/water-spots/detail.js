import kawasakiKuData from '../../../data/kawasaki_ku_water_spots.json';
import nakaharaData from '../../../data/nakahara_water_spots.json';
import takatsuKuData from '../../../data/takatsu_ku_water_spots.json';
import miyamaeKuData from '../../../data/miyamae_ku_water_spots.json';
import tamaKuData from '../../../data/tama_ku_water_spots.json';
import asaoKuData from '../../../data/asao_ku_water_spots.json';
import saiwaiKuData from '../../../data/saiwai_ku_water_spots.json';

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

function findSpotInAllWards(spotId) {
  for (const ward of Object.keys(WARD_DATA_MAP)) {
    const wardData = loadWardData(ward);
    if (wardData.spots) {
      const spot = wardData.spots.find(s => s.id === spotId);
      if (spot) {
        return spot;
      }
    }
  }
  return null;
}

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Spot ID is required'
      });
    }

    const spot = findSpotInAllWards(id);

    if (!spot) {
      return res.status(404).json({
        success: false,
        error: 'Water spot not found'
      });
    }

    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json({
      success: true,
      data: {
        ...spot,
        access_info: generateAccessInfo(spot),
        full_address: spot.address
      }
    });
  } catch (error) {
    console.error('Water spot detail error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

function generateAccessInfo(spot) {
  const stations = {
    '川崎区': '川崎駅',
    '中原区': '武蔵小杉駅',
    '高津区': '溝の口駅',
    '宮前区': '宮前平駅',
    '多摩区': '登戸駅',
    '麻生区': '新百合ヶ丘駅',
    '幸区': '川崎駅'
  };
  
  const nearestStation = stations[spot.ward];
  return nearestStation ? `${nearestStation}から徒歩圏内` : '公共交通機関をご利用ください';
}