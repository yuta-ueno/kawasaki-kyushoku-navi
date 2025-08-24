/**
 * Infrastructure: Static Water Spot Repository
 * JSONファイルを使用した給水スポットデータアクセス実装
 */

import kawasakiKuData from '../../data/kawasaki_ku_water_spots.json';
import nakaharaData from '../../data/nakahara_water_spots.json';
import takatsuKuData from '../../data/takatsu_ku_water_spots.json';
import miyamaeKuData from '../../data/miyamae_ku_water_spots.json';
import tamaKuData from '../../data/tama_ku_water_spots.json';
import asaoKuData from '../../data/asao_ku_water_spots.json';
import saiwaiKuData from '../../data/saiwai_ku_water_spots.json';

import { WaterSpot } from '../../domain/entities/WaterSpot.js';
import { WaterSpotRepository } from '../../domain/repositories/WaterSpotRepository.js';

export class StaticWaterSpotRepository extends WaterSpotRepository {
  constructor() {
    super();
    this.wardDataMap = {
      '川崎区': kawasakiKuData,
      '中原区': nakaharaData,
      '高津区': takatsuKuData,
      '宮前区': miyamaeKuData,
      '多摩区': tamaKuData,
      '麻生区': asaoKuData,
      '幸区': saiwaiKuData
    };

    this.validWards = Object.keys(this.wardDataMap);
    this.validCategories = [
      '市庁舎', '区役所', '市立図書館', 'スポーツ施設', '市民館', 
      '環境学習施設', 'こども文化センター', 'いこいの家', '出張所', 
      '科学館', '博物館', '農業施設', '温水プール', '民間協力店舗', 
      '分館', 'コミュニティ施設', '福祉施設'
    ];
  }

  /**
   * 給水スポット一覧取得（フィルタ付き）
   */
  async getWaterSpots(filters = {}) {
    try {
      let allSpots = [];

      // 区フィルタの適用
      if (filters.ward && filters.ward !== '全区' && this.validWards.includes(filters.ward)) {
        const wardData = this.wardDataMap[filters.ward];
        allSpots = wardData.spots || [];
      } else {
        // 全区のデータを取得
        allSpots = this.loadAllWardData();
      }

      // WaterSpotエンティティに変換
      const waterSpots = WaterSpot.fromArray(allSpots);

      // カテゴリフィルタの適用
      let filteredSpots = waterSpots;
      if (filters.category && filters.category !== '全て' && this.validCategories.includes(filters.category)) {
        filteredSpots = waterSpots.filter(spot => spot.category === filters.category);
      }

      // ライトバージョンか詳細バージョンか
      if (filters.light === 'true' || filters.light === true) {
        return filteredSpots.map(spot => spot.toLightVersion());
      }

      return filteredSpots;
    } catch (error) {
      throw new Error(`Error getting water spots: ${error.message}`);
    }
  }

  /**
   * 給水スポット詳細取得
   */
  async getWaterSpotById(spotId) {
    try {
      const allSpots = this.loadAllWardData();
      const spotData = allSpots.find(spot => spot.id === spotId);

      if (!spotData) {
        return null;
      }

      return WaterSpot.fromRawData(spotData);
    } catch (error) {
      throw new Error(`Error getting water spot by ID: ${error.message}`);
    }
  }

  /**
   * 区別の給水スポット取得
   */
  async getWaterSpotsByWard(ward) {
    try {
      if (!this.validWards.includes(ward)) {
        throw new Error(`Invalid ward: ${ward}`);
      }

      const wardData = this.wardDataMap[ward];
      const spots = wardData.spots || [];

      return WaterSpot.fromArray(spots);
    } catch (error) {
      throw new Error(`Error getting water spots by ward: ${error.message}`);
    }
  }

  /**
   * カテゴリ別の給水スポット取得
   */
  async getWaterSpotsByCategory(category) {
    try {
      if (!this.validCategories.includes(category)) {
        throw new Error(`Invalid category: ${category}`);
      }

      const allSpots = this.loadAllWardData();
      const filteredSpots = allSpots.filter(spot => spot.category === category);

      return WaterSpot.fromArray(filteredSpots);
    } catch (error) {
      throw new Error(`Error getting water spots by category: ${error.message}`);
    }
  }

  /**
   * 位置ベースの給水スポット検索
   */
  async getWaterSpotsNearby(latitude, longitude, radius = 5) {
    try {
      const allSpots = this.loadAllWardData();
      const waterSpots = WaterSpot.fromArray(allSpots);

      // 距離を計算してフィルタリング
      const nearbySpots = waterSpots.filter(spot => {
        const distance = spot.calculateDistance(
          latitude, 
          longitude, 
          spot.location.latitude, 
          spot.location.longitude
        );
        spot.distance = distance;
        return distance <= radius;
      });

      // 距離順でソート
      return nearbySpots.sort((a, b) => a.distance - b.distance);
    } catch (error) {
      throw new Error(`Error getting nearby water spots: ${error.message}`);
    }
  }

  /**
   * 検索条件によるスポット検索
   */
  async searchWaterSpots(searchTerm) {
    try {
      const allSpots = this.loadAllWardData();
      const waterSpots = WaterSpot.fromArray(allSpots);
      
      const searchLower = searchTerm.toLowerCase();

      const matchedSpots = waterSpots.filter(spot => {
        return (
          spot.name.toLowerCase().includes(searchLower) ||
          spot.address.toLowerCase().includes(searchLower) ||
          spot.category.toLowerCase().includes(searchLower) ||
          spot.ward.toLowerCase().includes(searchLower) ||
          (spot.description && spot.description.toLowerCase().includes(searchLower))
        );
      });

      return matchedSpots;
    } catch (error) {
      throw new Error(`Error searching water spots: ${error.message}`);
    }
  }

  /**
   * 利用可能な区一覧取得
   */
  async getAvailableWards() {
    return [...this.validWards];
  }

  /**
   * 利用可能なカテゴリ一覧取得
   */
  async getAvailableCategories() {
    return [...this.validCategories];
  }

  /**
   * プライベートメソッド: 全区のデータを読み込み
   */
  loadAllWardData() {
    const allSpots = [];
    
    for (const ward of this.validWards) {
      const wardData = this.wardDataMap[ward];
      if (wardData && wardData.spots) {
        allSpots.push(...wardData.spots);
      }
    }

    return allSpots;
  }

  /**
   * 統計情報取得
   */
  async getStatistics() {
    try {
      const allSpots = this.loadAllWardData();
      const waterSpots = WaterSpot.fromArray(allSpots);

      const statistics = {
        totalSpots: waterSpots.length,
        spotsByWard: {},
        spotsByCategory: {},
        lastUpdated: new Date().toISOString()
      };

      // 区別カウント
      waterSpots.forEach(spot => {
        statistics.spotsByWard[spot.ward] = (statistics.spotsByWard[spot.ward] || 0) + 1;
      });

      // カテゴリ別カウント
      waterSpots.forEach(spot => {
        statistics.spotsByCategory[spot.category] = (statistics.spotsByCategory[spot.category] || 0) + 1;
      });

      return statistics;
    } catch (error) {
      throw new Error(`Error getting statistics: ${error.message}`);
    }
  }

  /**
   * データの最終更新日取得
   */
  async getLastUpdated() {
    try {
      // 各区のデータから最新の更新日を取得
      let latestUpdate = null;

      for (const wardData of Object.values(this.wardDataMap)) {
        if (wardData.updated) {
          const updateDate = new Date(wardData.updated);
          if (!latestUpdate || updateDate > latestUpdate) {
            latestUpdate = updateDate;
          }
        }
      }

      return latestUpdate ? latestUpdate.toISOString() : null;
    } catch (error) {
      throw new Error(`Error getting last updated date: ${error.message}`);
    }
  }

  /**
   * 営業中のスポットのみ取得
   */
  async getCurrentlyOpenSpots() {
    try {
      const allSpots = this.loadAllWardData();
      const waterSpots = WaterSpot.fromArray(allSpots);

      return waterSpots.filter(spot => spot.isCurrentlyOpen() === true);
    } catch (error) {
      throw new Error(`Error getting currently open spots: ${error.message}`);
    }
  }
}

export default StaticWaterSpotRepository;