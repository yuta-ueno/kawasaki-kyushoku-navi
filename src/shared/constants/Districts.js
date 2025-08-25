/**
 * Shared Constants: Districts
 * 川崎市地区関連の定数定義
 */

export const DISTRICTS = {
  A: 'A',
  B: 'B', 
  C: 'C'
};

export const DISTRICT_NAMES = {
  [DISTRICTS.A]: '川崎区・中原区',
  [DISTRICTS.B]: '幸区・多摩区・麻生区',
  [DISTRICTS.C]: '高津区・宮前区'
};

export const DISTRICT_CODES = Object.values(DISTRICTS);

export const DISTRICT_MAPPING = {
  '川崎区': DISTRICTS.A,
  '中原区': DISTRICTS.A,
  '幸区': DISTRICTS.B,
  '多摩区': DISTRICTS.B,
  '麻生区': DISTRICTS.B,
  '高津区': DISTRICTS.C,
  '宮前区': DISTRICTS.C
};

export const isValidDistrict = (district) => {
  return DISTRICT_CODES.includes(district);
};

export const getDistrictName = (district) => {
  return DISTRICT_NAMES[district] || district;
};

export const getDistrictByWard = (ward) => {
  return DISTRICT_MAPPING[ward] || null;
};

const Districts = {
  DISTRICTS,
  DISTRICT_NAMES,
  DISTRICT_CODES,
  DISTRICT_MAPPING,
  isValidDistrict,
  getDistrictName,
  getDistrictByWard
};

export default Districts;