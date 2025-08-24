/**
 * Domain Repository Interface: WaterSpotRepository
 * 給水スポットデータアクセスの抽象化
 * Infrastructure層で具体実装する
 */

export class WaterSpotRepository {
  /**
   * 給水スポット一覧取得（フィルタ付き）
   * @param {Object} filters - { ward, category, light }
   * @returns {Promise<WaterSpot[]>}
   */
  async getWaterSpots(filters = {}) {
    throw new Error('getWaterSpots must be implemented');
  }

  /**
   * 給水スポット詳細取得
   * @param {string} spotId 
   * @returns {Promise<WaterSpot|null>}
   */
  async getWaterSpotById(spotId) {
    throw new Error('getWaterSpotById must be implemented');
  }

  /**
   * 区別の給水スポット取得
   * @param {string} ward 
   * @returns {Promise<WaterSpot[]>}
   */
  async getWaterSpotsByWard(ward) {
    throw new Error('getWaterSpotsByWard must be implemented');
  }

  /**
   * カテゴリ別の給水スポット取得
   * @param {string} category 
   * @returns {Promise<WaterSpot[]>}
   */
  async getWaterSpotsByCategory(category) {
    throw new Error('getWaterSpotsByCategory must be implemented');
  }

  /**
   * 位置ベースの給水スポット検索
   * @param {number} latitude 
   * @param {number} longitude 
   * @param {number} radius - km
   * @returns {Promise<WaterSpot[]>}
   */
  async getWaterSpotsNearby(latitude, longitude, radius = 5) {
    throw new Error('getWaterSpotsNearby must be implemented');
  }

  /**
   * 検索条件によるスポット検索
   * @param {string} searchTerm 
   * @returns {Promise<WaterSpot[]>}
   */
  async searchWaterSpots(searchTerm) {
    throw new Error('searchWaterSpots must be implemented');
  }

  /**
   * 利用可能な区一覧取得
   * @returns {Promise<string[]>}
   */
  async getAvailableWards() {
    throw new Error('getAvailableWards must be implemented');
  }

  /**
   * 利用可能なカテゴリ一覧取得
   * @returns {Promise<string[]>}
   */
  async getAvailableCategories() {
    throw new Error('getAvailableCategories must be implemented');
  }
}

export default WaterSpotRepository;