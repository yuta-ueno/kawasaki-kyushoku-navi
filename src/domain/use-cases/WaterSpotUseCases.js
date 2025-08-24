/**
 * Domain Use Cases: WaterSpot
 * 給水スポットのビジネスロジック
 */

import { WaterSpot } from '../entities/WaterSpot.js';

export class GetWaterSpotsUseCase {
  constructor(waterSpotRepository, cacheService) {
    this.waterSpotRepository = waterSpotRepository;
    this.cacheService = cacheService;
  }

  async execute(filters = {}, userLocation = null) {
    try {
      // キャッシュキーの生成
      const cacheKey = `water-spots:${JSON.stringify(filters)}`;
      const cached = await this.cacheService?.get(cacheKey);
      
      let spots;
      if (cached) {
        spots = WaterSpot.fromArray(cached);
      } else {
        // リポジトリからデータ取得
        spots = await this.waterSpotRepository.getWaterSpots(filters);
        
        // キャッシュに保存（1時間）
        if (this.cacheService) {
          await this.cacheService.set(
            cacheKey, 
            spots.map(spot => spot.toJSON()), 
            3600
          );
        }
      }

      // ユーザー位置情報がある場合は距離を計算
      if (userLocation) {
        spots = this.addDistanceToSpots(spots, userLocation);
      }

      // フィルタリングとソート
      spots = this.applyFilters(spots, filters);
      spots = this.sortSpots(spots, userLocation);

      return {
        spots,
        total: spots.length,
        filters
      };
    } catch (error) {
      throw new Error(`Failed to get water spots: ${error.message}`);
    }
  }

  addDistanceToSpots(spots, userLocation) {
    return spots.map(spot => {
      spot.setDistance(userLocation);
      return spot;
    });
  }

  applyFilters(spots, filters) {
    let filtered = [...spots];

    // 区でのフィルタリング
    if (filters.ward && filters.ward !== '全区') {
      filtered = filtered.filter(spot => spot.ward === filters.ward);
    }

    // カテゴリでのフィルタリング
    if (filters.category && filters.category !== '全て') {
      filtered = filtered.filter(spot => spot.category === filters.category);
    }

    // 営業中のみ表示
    if (filters.openOnly) {
      filtered = filtered.filter(spot => {
        const isOpen = spot.isCurrentlyOpen();
        return isOpen === true; // null（不明）は除外
      });
    }

    return filtered;
  }

  sortSpots(spots, userLocation) {
    if (userLocation) {
      // 距離順でソート
      return spots.sort((a, b) => {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    } else {
      // 区名、カテゴリ、名前順でソート
      return spots.sort((a, b) => {
        if (a.ward !== b.ward) {
          return a.ward.localeCompare(b.ward, 'ja');
        }
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category, 'ja');
        }
        return a.name.localeCompare(b.name, 'ja');
      });
    }
  }
}

export class GetWaterSpotDetailUseCase {
  constructor(waterSpotRepository, cacheService) {
    this.waterSpotRepository = waterSpotRepository;
    this.cacheService = cacheService;
  }

  async execute(spotId) {
    try {
      // キャッシュチェック
      const cacheKey = `water-spot:detail:${spotId}`;
      const cached = await this.cacheService?.get(cacheKey);
      
      if (cached) {
        return WaterSpot.fromRawData(cached);
      }

      // リポジトリからデータ取得
      const spot = await this.waterSpotRepository.getWaterSpotById(spotId);
      
      if (!spot) {
        throw new Error('Water spot not found');
      }

      // キャッシュに保存（30分）
      if (this.cacheService) {
        await this.cacheService.set(cacheKey, spot.toJSON(), 1800);
      }

      return spot;
    } catch (error) {
      throw new Error(`Failed to get water spot details: ${error.message}`);
    }
  }
}

export class SearchWaterSpotsUseCase {
  constructor(waterSpotRepository) {
    this.waterSpotRepository = waterSpotRepository;
  }

  async execute(searchTerm, userLocation = null) {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        throw new Error('Search term must be at least 2 characters');
      }

      // 検索実行
      let spots = await this.waterSpotRepository.searchWaterSpots(searchTerm.trim());
      
      // ユーザー位置情報がある場合は距離を計算
      if (userLocation) {
        spots = spots.map(spot => {
          spot.setDistance(userLocation);
          return spot;
        });
        
        // 距離順でソート
        spots.sort((a, b) => {
          if (a.distance === null && b.distance === null) return 0;
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        });
      }

      return {
        spots,
        total: spots.length,
        searchTerm
      };
    } catch (error) {
      throw new Error(`Failed to search water spots: ${error.message}`);
    }
  }
}

export class GetNearbyWaterSpotsUseCase {
  constructor(waterSpotRepository) {
    this.waterSpotRepository = waterSpotRepository;
  }

  async execute(userLocation, radius = 5) {
    try {
      if (!userLocation || !userLocation.latitude || !userLocation.longitude) {
        throw new Error('User location is required');
      }

      // 近くのスポット検索
      const spots = await this.waterSpotRepository.getWaterSpotsNearby(
        userLocation.latitude,
        userLocation.longitude,
        radius
      );

      // 距離を計算してソート
      const spotsWithDistance = spots.map(spot => {
        spot.setDistance(userLocation);
        return spot;
      }).sort((a, b) => a.distance - b.distance);

      return {
        spots: spotsWithDistance,
        total: spotsWithDistance.length,
        userLocation,
        radius
      };
    } catch (error) {
      throw new Error(`Failed to get nearby water spots: ${error.message}`);
    }
  }
}

export class GetWaterSpotFiltersUseCase {
  constructor(waterSpotRepository) {
    this.waterSpotRepository = waterSpotRepository;
  }

  async execute() {
    try {
      const [wards, categories] = await Promise.all([
        this.waterSpotRepository.getAvailableWards(),
        this.waterSpotRepository.getAvailableCategories()
      ]);

      return {
        wards: ['全区', ...wards],
        categories: ['全て', ...categories]
      };
    } catch (error) {
      throw new Error(`Failed to get filter options: ${error.message}`);
    }
  }
}

export class GetWaterSpotStatisticsUseCase {
  constructor(waterSpotRepository) {
    this.waterSpotRepository = waterSpotRepository;
  }

  async execute() {
    try {
      const allSpots = await this.waterSpotRepository.getWaterSpots({});
      
      // 統計情報の計算
      const statistics = {
        totalSpots: allSpots.length,
        spotsByWard: this.countByWard(allSpots),
        spotsByCategory: this.countByCategory(allSpots),
        averageSpotsPerWard: Math.round(allSpots.length / 7 * 10) / 10,
        lastUpdated: new Date().toISOString()
      };

      return statistics;
    } catch (error) {
      throw new Error(`Failed to get water spot statistics: ${error.message}`);
    }
  }

  countByWard(spots) {
    const counts = {};
    spots.forEach(spot => {
      counts[spot.ward] = (counts[spot.ward] || 0) + 1;
    });
    return counts;
  }

  countByCategory(spots) {
    const counts = {};
    spots.forEach(spot => {
      counts[spot.category] = (counts[spot.category] || 0) + 1;
    });
    return counts;
  }
}

export default {
  GetWaterSpotsUseCase,
  GetWaterSpotDetailUseCase,
  SearchWaterSpotsUseCase,
  GetNearbyWaterSpotsUseCase,
  GetWaterSpotFiltersUseCase,
  GetWaterSpotStatisticsUseCase
};