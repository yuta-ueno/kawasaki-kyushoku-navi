/**
 * Interface: Menu Controller
 * HTTPリクエストの処理とビジネスロジックの呼び出し
 */

import { 
  GetTodayMenuUseCase, 
  GetMonthlyMenusUseCase,
  ImportMenusUseCase,
  GetMenuStatisticsUseCase 
} from '../../domain/use-cases/MenuUseCases.js';
import { FirebaseMenuRepository } from '../../infrastructure/repositories/FirebaseMenuRepository.js';
import { getCacheInstance } from '../../infrastructure/cache/InMemoryCache.js';

export class MenuController {
  constructor() {
    this.menuRepository = new FirebaseMenuRepository();
    this.cacheService = getCacheInstance();
    
    // Use Cases の初期化
    this.getTodayMenuUseCase = new GetTodayMenuUseCase(this.menuRepository, this.cacheService);
    this.getMonthlyMenusUseCase = new GetMonthlyMenusUseCase(this.menuRepository, this.cacheService);
    this.importMenusUseCase = new ImportMenusUseCase(this.menuRepository);
    this.getMenuStatisticsUseCase = new GetMenuStatisticsUseCase(this.menuRepository);
  }

  /**
   * 今日の給食メニュー取得エンドポイント
   */
  async getTodayMenu(req, res) {
    try {
      const { date, district } = req.validatedQuery;
      
      const menu = await this.getTodayMenuUseCase.execute(date, district);
      
      if (!menu) {
        return res.status(404).json({
          success: false,
          error: 'Not found',
          message: `指定された日付(${date})・地区(${district})の給食データが見つかりません`,
          metadata: {
            requestId: req.requestId,
            timestamp: new Date().toISOString(),
            query: { date, district }
          }
        });
      }

      return res.status(200).json({
        success: true,
        data: menu.toApiResponse(),
        metadata: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
          cached: req.fromCache || false,
          query: { date, district }
        }
      });
    } catch (error) {
      console.error('MenuController.getTodayMenu error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'メニューデータの取得に失敗しました',
        metadata: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
          errorType: error.constructor.name
        }
      });
    }
  }

  /**
   * 月間給食メニュー取得エンドポイント
   */
  async getMonthlyMenus(req, res) {
    try {
      const { year, month, district } = req.validatedQuery;
      
      const result = await this.getMonthlyMenusUseCase.execute(year, month, district);
      
      return res.status(200).json({
        success: true,
        data: {
          menus: result.menus.map(menu => menu.toApiResponse()),
          statistics: result.statistics,
          total: result.total
        },
        metadata: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
          cached: req.fromCache || false,
          query: { year, month, district }
        }
      });
    } catch (error) {
      console.error('MenuController.getMonthlyMenus error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: '月間メニューデータの取得に失敗しました',
        metadata: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
          errorType: error.constructor.name
        }
      });
    }
  }

  /**
   * メニューインポートエンドポイント（管理者用）
   */
  async importMenus(req, res) {
    try {
      const { menuData } = req.body;
      
      if (!menuData || !Array.isArray(menuData)) {
        return res.status(400).json({
          success: false,
          error: 'Bad request',
          message: 'メニューデータが無効です。配列形式で送信してください。',
          metadata: {
            requestId: req.requestId,
            timestamp: new Date().toISOString()
          }
        });
      }

      const result = await this.importMenusUseCase.execute(menuData);
      
      return res.status(200).json({
        success: true,
        data: {
          imported: result.success,
          failed: result.failed,
          total: result.total
        },
        message: `${result.success}件のメニューをインポートしました`,
        metadata: {
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('MenuController.importMenus error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message || 'メニューのインポートに失敗しました',
        metadata: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
          errorType: error.constructor.name
        }
      });
    }
  }

  /**
   * メニュー統計情報取得エンドポイント
   */
  async getMenuStatistics(req, res) {
    try {
      const { startDate, endDate, district } = req.validatedQuery;
      
      const statistics = await this.getMenuStatisticsUseCase.execute(startDate, endDate, district);
      
      return res.status(200).json({
        success: true,
        data: statistics,
        metadata: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
          query: { startDate, endDate, district }
        }
      });
    } catch (error) {
      console.error('MenuController.getMenuStatistics error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: '統計情報の取得に失敗しました',
        metadata: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
          errorType: error.constructor.name
        }
      });
    }
  }

  /**
   * メニュー検索エンドポイント
   */
  async searchMenus(req, res) {
    try {
      const { searchTerm, district, minCalories, maxCalories } = req.validatedQuery;
      
      let results;
      
      if (minCalories && maxCalories) {
        // カロリーによる検索
        results = await this.menuRepository.searchMenusByCalories(
          parseInt(minCalories), 
          parseInt(maxCalories), 
          district
        );
      } else {
        // テキストによる検索（実装必要）
        results = [];
      }
      
      return res.status(200).json({
        success: true,
        data: {
          menus: results.map(menu => menu.toApiResponse()),
          total: results.length
        },
        metadata: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
          query: { searchTerm, district, minCalories, maxCalories }
        }
      });
    } catch (error) {
      console.error('MenuController.searchMenus error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'メニュー検索に失敗しました',
        metadata: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
          errorType: error.constructor.name
        }
      });
    }
  }

  /**
   * ヘルスチェックエンドポイント
   */
  async healthCheck(req, res) {
    try {
      const cacheStats = this.cacheService.getStats();
      
      return res.status(200).json({
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          cache: cacheStats,
          version: '1.0.0'
        }
      });
    } catch (error) {
      console.error('MenuController.healthCheck error:', error);
      return res.status(503).json({
        success: false,
        error: 'Service unavailable',
        message: 'サービスが利用できません'
      });
    }
  }
}

// シングルトンインスタンス
let controllerInstance = null;

export function getMenuController() {
  if (!controllerInstance) {
    controllerInstance = new MenuController();
  }
  return controllerInstance;
}

export default MenuController;