/**
 * Domain Repository Interface: MenuRepository
 * 給食メニューデータアクセスの抽象化
 * Infrastructure層で具体実装する
 */

export class MenuRepository {
  /**
   * 今日の給食メニュー取得
   * @param {string} date - YYYY-MM-DD format
   * @param {string} district - A, B, or C
   * @returns {Promise<Menu|null>}
   */
  async getTodayMenu(date, district) {
    throw new Error('getTodayMenu must be implemented');
  }

  /**
   * 月間給食メニュー取得
   * @param {number} year 
   * @param {number} month 
   * @param {string} district 
   * @returns {Promise<Menu[]>}
   */
  async getMonthlyMenus(year, month, district) {
    throw new Error('getMonthlyMenus must be implemented');
  }

  /**
   * 給食メニュー保存（管理者用）
   * @param {Menu} menu 
   * @returns {Promise<boolean>}
   */
  async saveMenu(menu) {
    throw new Error('saveMenu must be implemented');
  }

  /**
   * 給食メニュー削除（管理者用）
   * @param {string} date 
   * @param {string} district 
   * @returns {Promise<boolean>}
   */
  async deleteMenu(date, district) {
    throw new Error('deleteMenu must be implemented');
  }

  /**
   * 期間指定でのメニュー取得
   * @param {string} startDate 
   * @param {string} endDate 
   * @param {string} district 
   * @returns {Promise<Menu[]>}
   */
  async getMenusByDateRange(startDate, endDate, district) {
    throw new Error('getMenusByDateRange must be implemented');
  }

  /**
   * 複数メニューの一括保存（インポート用）
   * @param {Menu[]} menus 
   * @returns {Promise<{success: number, failed: number}>}
   */
  async bulkSaveMenus(menus) {
    throw new Error('bulkSaveMenus must be implemented');
  }
}

export default MenuRepository;