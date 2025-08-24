/**
 * Domain Entity: WaterSpot (給水スポット)
 * ビジネスルールとバリデーションを含む中核エンティティ
 */

export class WaterSpot {
  constructor({
    id,
    name,
    category,
    ward,
    address,
    location,
    hours,
    description = null,
    access = null,
    facilities = null,
    notes = null,
    updated = null,
    distance = null
  }) {
    this.validateInputs({ id, name, category, ward, location });
    
    this.id = id;
    this.name = name;
    this.category = category;
    this.ward = ward;
    this.address = address;
    this.location = location;
    this.hours = hours;
    this.description = description;
    this.access = access;
    this.facilities = facilities;
    this.notes = notes;
    this.updated = updated;
    this.distance = distance; // ユーザー位置からの距離
  }

  /**
   * バリデーション - ビジネスルール
   */
  validateInputs({ id, name, category, ward, location }) {
    if (!id || typeof id !== 'string') {
      throw new Error('ID is required and must be a string');
    }
    
    if (!name || typeof name !== 'string') {
      throw new Error('Name is required and must be a string');
    }
    
    if (!category || !this.isValidCategory(category)) {
      throw new Error('Invalid category');
    }
    
    if (!ward || !this.isValidWard(ward)) {
      throw new Error('Invalid ward');
    }
    
    if (!location || !this.isValidLocation(location)) {
      throw new Error('Invalid location coordinates');
    }
  }

  /**
   * カテゴリの検証
   */
  isValidCategory(category) {
    const validCategories = [
      '市庁舎', '区役所', '市立図書館', 'スポーツ施設', '市民館', 
      '環境学習施設', 'こども文化センター', 'いこいの家', '出張所', 
      '科学館', '博物館', '農業施設', '温水プール', '民間協力店舗', 
      '分館', 'コミュニティ施設', '福祉施設'
    ];
    return validCategories.includes(category);
  }

  /**
   * 区の検証
   */
  isValidWard(ward) {
    const validWards = ['川崎区', '中原区', '高津区', '宮前区', '多摩区', '麻生区', '幸区'];
    return validWards.includes(ward);
  }

  /**
   * 位置情報の検証
   */
  isValidLocation(location) {
    if (!location || typeof location !== 'object') return false;
    
    const { latitude, longitude } = location;
    return typeof latitude === 'number' && typeof longitude === 'number' &&
           latitude >= -90 && latitude <= 90 &&
           longitude >= -180 && longitude <= 180;
  }

  /**
   * 営業時間の概要取得
   */
  getHoursSummary() {
    if (!this.hours) return '要確認';
    
    if (this.hours.mon_fri) {
      return `平日 ${this.hours.mon_fri}`;
    }
    
    if (this.hours.mon_sun) {
      return `毎日 ${this.hours.mon_sun}`;
    }
    
    return this.hours.type || '要確認';
  }

  /**
   * 現在営業中かどうか判定
   */
  isCurrentlyOpen() {
    if (!this.hours) return null; // 不明
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 100 + currentMinute;
    
    // 簡単な営業時間チェック（複雑な場合は別途実装）
    if (this.hours.mon_fri) {
      const [start, end] = this.parseHours(this.hours.mon_fri);
      if (start && end) {
        return currentTime >= start && currentTime <= end;
      }
    }
    
    return null; // 判定不可
  }

  /**
   * 営業時間をパースする
   */
  parseHours(hoursString) {
    const match = hoursString.match(/(\d{1,2}):(\d{2})\s*[～〜-]\s*(\d{1,2}):(\d{2})/);
    if (!match) return [null, null];
    
    const startTime = parseInt(match[1]) * 100 + parseInt(match[2]);
    const endTime = parseInt(match[3]) * 100 + parseInt(match[4]);
    
    return [startTime, endTime];
  }

  /**
   * アイコンの取得
   */
  getIcon() {
    const iconMap = {
      '市庁舎': '🏛️',
      '区役所': '🏢',
      '市立図書館': '📚',
      'スポーツ施設': '🏃',
      '市民館': '🏛️',
      '環境学習施設': '🌿',
      'こども文化センター': '🎨',
      'いこいの家': '🏠',
      '出張所': '🏢',
      '科学館': '🔬',
      '博物館': '🏺',
      '農業施設': '🌾',
      '温水プール': '🏊',
      '民間協力店舗': '🏪',
      '分館': '📚',
      'コミュニティ施設': '🏘️',
      '福祉施設': '🏥'
    };
    return iconMap[this.category] || '🚰';
  }

  /**
   * 距離の設定
   */
  setDistance(userLocation) {
    if (!userLocation || !userLocation.latitude || !userLocation.longitude) {
      this.distance = null;
      return;
    }
    
    this.distance = this.calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      this.location.latitude,
      this.location.longitude
    );
  }

  /**
   * 距離計算 (Haversine formula)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // 地球の半径 (km)
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // km単位
  }

  /**
   * 度をラジアンに変換
   */
  toRad(deg) {
    return deg * (Math.PI / 180);
  }

  /**
   * 距離フォーマット
   */
  getFormattedDistance() {
    if (!this.distance) return null;
    
    if (this.distance < 1) {
      return `${Math.round(this.distance * 1000)}m`;
    } else {
      return `${this.distance.toFixed(1)}km`;
    }
  }

  /**
   * ライトバージョン（リスト表示用）
   */
  toLightVersion() {
    return {
      id: this.id,
      name: this.name,
      category: this.category,
      ward: this.ward,
      address: this.address,
      location: this.location,
      hours_summary: this.getHoursSummary(),
      icon: this.getIcon(),
      distance: this.distance,
      formattedDistance: this.getFormattedDistance()
    };
  }

  /**
   * 詳細バージョン
   */
  toDetailedVersion() {
    return {
      ...this.toLightVersion(),
      hours: this.hours,
      description: this.description,
      access: this.access,
      facilities: this.facilities,
      notes: this.notes,
      updated: this.updated,
      isCurrentlyOpen: this.isCurrentlyOpen()
    };
  }

  /**
   * JSONシリアライゼーション
   */
  toJSON() {
    return this.toDetailedVersion();
  }

  /**
   * Factory method - 生データから作成
   */
  static fromRawData(data) {
    if (!data) return null;
    
    return new WaterSpot({
      id: data.id,
      name: data.name,
      category: data.category,
      ward: data.ward,
      address: data.address,
      location: data.location,
      hours: data.hours,
      description: data.description,
      access: data.access,
      facilities: data.facilities,
      notes: data.notes,
      updated: data.updated,
      distance: data.distance
    });
  }

  /**
   * Factory method - 配列から作成
   */
  static fromArray(dataArray) {
    if (!Array.isArray(dataArray)) return [];
    
    return dataArray
      .map(data => {
        try {
          return WaterSpot.fromRawData(data);
        } catch (error) {
          console.warn(`Invalid water spot data:`, data, error);
          return null;
        }
      })
      .filter(spot => spot !== null);
  }
}

export default WaterSpot;