/**
 * Shared Types: Menu
 * 給食メニュー関連の型定義とバリデーション
 */

/**
 * 給食メニューの型定義（JSDoc形式）
 * @typedef {Object} MenuData
 * @property {string} date - YYYY-MM-DD format
 * @property {string} district - A, B, or C
 * @property {string} dayOfWeek - 曜日
 * @property {MenuItems} menu - メニュー内容
 * @property {NutritionInfo} nutrition - 栄養情報
 * @property {boolean} hasSpecialMenu - 特別メニューフラグ
 * @property {string|null} notes - 備考
 */

/**
 * @typedef {Object} MenuItems
 * @property {string[]} items - メニュー項目の配列
 * @property {string} description - メニューの説明
 */

/**
 * @typedef {Object} NutritionInfo
 * @property {number} energy - カロリー (kcal)
 * @property {number} protein - タンパク質 (g)
 * @property {number} [fat] - 脂質 (g)
 * @property {number} [carbohydrate] - 炭水化物 (g)
 * @property {number} [salt] - 塩分 (g)
 */

/**
 * @typedef {Object} MenuApiResponse
 * @property {string} date
 * @property {string} district
 * @property {string} dayOfWeek
 * @property {MenuItems} menu
 * @property {NutritionInfo} nutrition
 * @property {boolean} hasSpecialMenu
 * @property {string|null} notes
 * @property {string} documentId
 * @property {boolean} isSpecial
 * @property {string} dayOfWeekJP
 * @property {string} districtNameJP
 * @property {string} menuDescription
 */

export const MenuSchema = {
  date: {
    type: 'string',
    required: true,
    pattern: /^\d{4}-\d{2}-\d{2}$/,
    description: 'Date in YYYY-MM-DD format'
  },
  district: {
    type: 'string',
    required: true,
    enum: ['A', 'B', 'C'],
    description: 'District code'
  },
  dayOfWeek: {
    type: 'string',
    required: false,
    description: 'Day of week'
  },
  menu: {
    type: 'object',
    required: true,
    properties: {
      items: {
        type: 'array',
        required: true,
        minItems: 1,
        items: { type: 'string' }
      },
      description: {
        type: 'string',
        required: false
      }
    }
  },
  nutrition: {
    type: 'object',
    required: true,
    properties: {
      energy: {
        type: 'number',
        required: true,
        min: 0
      },
      protein: {
        type: 'number',
        required: false,
        min: 0
      }
    }
  },
  hasSpecialMenu: {
    type: 'boolean',
    required: false,
    default: false
  },
  notes: {
    type: 'string',
    required: false,
    nullable: true
  }
};

export const validateMenuData = (data) => {
  const errors = [];

  // 必須フィールドのチェック
  if (!data.date) errors.push('date is required');
  if (!data.district) errors.push('district is required');
  if (!data.menu) errors.push('menu is required');
  if (!data.nutrition) errors.push('nutrition is required');

  // 日付形式のチェック
  if (data.date && !MenuSchema.date.pattern.test(data.date)) {
    errors.push('date must be in YYYY-MM-DD format');
  }

  // 地区のチェック
  if (data.district && !MenuSchema.district.enum.includes(data.district)) {
    errors.push('district must be A, B, or C');
  }

  // メニューのチェック
  if (data.menu) {
    if (!data.menu.items || !Array.isArray(data.menu.items) || data.menu.items.length === 0) {
      errors.push('menu.items is required and must be a non-empty array');
    }
  }

  // 栄養情報のチェック
  if (data.nutrition) {
    if (typeof data.nutrition.energy !== 'number' || data.nutrition.energy < 0) {
      errors.push('nutrition.energy must be a non-negative number');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const sanitizeMenuData = (data) => {
  return {
    date: data.date?.toString().trim(),
    district: data.district?.toString().trim().toUpperCase(),
    dayOfWeek: data.dayOfWeek?.toString().trim(),
    menu: {
      items: Array.isArray(data.menu?.items) ? data.menu.items.map(item => item.toString().trim()) : [],
      description: data.menu?.description?.toString().trim() || ''
    },
    nutrition: {
      energy: Number(data.nutrition?.energy) || 0,
      protein: Number(data.nutrition?.protein) || 0,
      fat: Number(data.nutrition?.fat) || undefined,
      carbohydrate: Number(data.nutrition?.carbohydrate) || undefined,
      salt: Number(data.nutrition?.salt) || undefined
    },
    hasSpecialMenu: Boolean(data.hasSpecialMenu),
    notes: data.notes ? data.notes.toString().trim() : null
  };
};

export const createEmptyMenu = (date, district) => {
  return {
    date,
    district,
    dayOfWeek: '',
    menu: {
      items: [],
      description: ''
    },
    nutrition: {
      energy: 0,
      protein: 0
    },
    hasSpecialMenu: false,
    notes: null
  };
};

const Menu = {
  MenuSchema,
  validateMenuData,
  sanitizeMenuData,
  createEmptyMenu
};

export default Menu;