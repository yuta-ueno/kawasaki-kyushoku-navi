/**
 * Domain Use Cases: Menu
 * 給食メニューのビジネスロジック
 */

import { Menu } from '../entities/Menu.js';

export class GetTodayMenuUseCase {
  constructor(menuRepository, cacheService) {
    this.menuRepository = menuRepository;
    this.cacheService = cacheService;
  }

  async execute(date, district) {
    try {
      // キャッシュチェック
      const cacheKey = `menu:today:${date}:${district}`;
      const cached = await this.cacheService?.get(cacheKey);
      if (cached) {
        return Menu.fromFirestoreData(cached);
      }

      // リポジトリからデータ取得
      const menu = await this.menuRepository.getTodayMenu(date, district);
      
      // キャッシュに保存（5分間）
      if (menu && this.cacheService) {
        await this.cacheService.set(cacheKey, menu.toJSON(), 300);
      }

      return menu;
    } catch (error) {
      throw new Error(`Failed to get today's menu: ${error.message}`);
    }
  }
}

export class GetMonthlyMenusUseCase {
  constructor(menuRepository, cacheService) {
    this.menuRepository = menuRepository;
    this.cacheService = cacheService;
  }

  async execute(year, month, district) {
    try {
      // キャッシュチェック（長期間）
      const cacheKey = `menu:monthly:${year}:${month}:${district}`;
      const cached = await this.cacheService?.get(cacheKey);
      if (cached) {
        return cached.map(data => Menu.fromFirestoreData(data));
      }

      // リポジトリからデータ取得
      const menus = await this.menuRepository.getMonthlyMenus(year, month, district);
      
      // 統計情報の計算
      const statistics = this.calculateStatistics(menus);
      
      // キャッシュに保存（1時間）
      if (menus && this.cacheService) {
        await this.cacheService.set(
          cacheKey, 
          menus.map(menu => menu.toJSON()), 
          3600
        );
      }

      return {
        menus,
        statistics,
        total: menus.length
      };
    } catch (error) {
      throw new Error(`Failed to get monthly menus: ${error.message}`);
    }
  }

  calculateStatistics(menus) {
    if (!menus || menus.length === 0) {
      return {
        totalMenus: 0,
        specialMenus: 0,
        avgCalories: 0,
        avgProtein: 0
      };
    }

    const totalMenus = menus.length;
    const specialMenus = menus.filter(menu => menu.isSpecial()).length;
    const avgCalories = Math.round(
      menus.reduce((sum, menu) => sum + menu.getCalories(), 0) / totalMenus
    );
    const avgProtein = Math.round(
      menus.reduce((sum, menu) => sum + menu.getProtein(), 0) / totalMenus * 10
    ) / 10;

    return {
      totalMenus,
      specialMenus,
      avgCalories,
      avgProtein
    };
  }
}

export class ImportMenusUseCase {
  constructor(menuRepository) {
    this.menuRepository = menuRepository;
  }

  async execute(menuData) {
    try {
      // データの前処理とバリデーション
      const menus = this.processMenuData(menuData);
      
      // 重複チェック
      await this.checkForDuplicates(menus);
      
      // 一括保存
      const result = await this.menuRepository.bulkSaveMenus(menus);
      
      return {
        success: result.success,
        failed: result.failed,
        total: menus.length
      };
    } catch (error) {
      throw new Error(`Failed to import menus: ${error.message}`);
    }
  }

  processMenuData(rawData) {
    if (!Array.isArray(rawData)) {
      throw new Error('Menu data must be an array');
    }

    return rawData.map((item, index) => {
      try {
        return new Menu({
          date: item.date,
          district: item.district,
          dayOfWeek: item.dayOfWeek,
          menu: item.menu,
          nutrition: item.nutrition,
          hasSpecialMenu: item.hasSpecialMenu || false,
          notes: item.notes || null
        });
      } catch (error) {
        throw new Error(`Invalid menu data at index ${index}: ${error.message}`);
      }
    });
  }

  async checkForDuplicates(menus) {
    // 重複チェックロジック（必要に応じて実装）
    const duplicates = new Set();
    const seen = new Set();
    
    menus.forEach(menu => {
      const key = menu.getDocumentId();
      if (seen.has(key)) {
        duplicates.add(key);
      } else {
        seen.add(key);
      }
    });

    if (duplicates.size > 0) {
      throw new Error(`Duplicate menu entries found: ${Array.from(duplicates).join(', ')}`);
    }
  }
}

export class GetMenuStatisticsUseCase {
  constructor(menuRepository) {
    this.menuRepository = menuRepository;
  }

  async execute(startDate, endDate, district) {
    try {
      const menus = await this.menuRepository.getMenusByDateRange(
        startDate, 
        endDate, 
        district
      );

      return {
        totalMenus: menus.length,
        specialMenus: menus.filter(menu => menu.isSpecial()).length,
        avgCalories: this.calculateAverageCalories(menus),
        avgProtein: this.calculateAverageProtein(menus),
        menusByWeekday: this.groupMenusByWeekday(menus),
        nutritionTrends: this.calculateNutritionTrends(menus)
      };
    } catch (error) {
      throw new Error(`Failed to get menu statistics: ${error.message}`);
    }
  }

  calculateAverageCalories(menus) {
    if (menus.length === 0) return 0;
    return Math.round(
      menus.reduce((sum, menu) => sum + menu.getCalories(), 0) / menus.length
    );
  }

  calculateAverageProtein(menus) {
    if (menus.length === 0) return 0;
    return Math.round(
      menus.reduce((sum, menu) => sum + menu.getProtein(), 0) / menus.length * 10
    ) / 10;
  }

  groupMenusByWeekday(menus) {
    const weekdays = {
      '月': [], '火': [], '水': [], '木': [], '金': []
    };

    menus.forEach(menu => {
      const day = menu.getDayOfWeekJP();
      if (weekdays[day]) {
        weekdays[day].push(menu);
      }
    });

    return weekdays;
  }

  calculateNutritionTrends(menus) {
    return menus.map(menu => ({
      date: menu.date,
      calories: menu.getCalories(),
      protein: menu.getProtein()
    }));
  }
}

const MenuUseCases = {
  GetTodayMenuUseCase,
  GetMonthlyMenusUseCase,
  ImportMenusUseCase,
  GetMenuStatisticsUseCase
};

export default MenuUseCases;