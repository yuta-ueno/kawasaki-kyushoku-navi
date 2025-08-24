/**
 * Domain Entity: Menu (給食メニュー)
 * ビジネスルールとバリデーションを含む中核エンティティ
 */

export class Menu {
  constructor({
    date,
    district,
    dayOfWeek,
    menu,
    nutrition,
    hasSpecialMenu = false,
    notes = null
  }) {
    this.validateInputs({ date, district, menu, nutrition });
    
    this.date = date;
    this.district = district;
    this.dayOfWeek = dayOfWeek;
    this.menu = menu;
    this.nutrition = nutrition;
    this.hasSpecialMenu = hasSpecialMenu;
    this.notes = notes;
  }

  /**
   * バリデーション - ビジネスルール
   */
  validateInputs({ date, district, menu, nutrition }) {
    if (!date || !this.isValidDate(date)) {
      throw new Error('Invalid date format. Expected YYYY-MM-DD');
    }
    
    if (!district || !this.isValidDistrict(district)) {
      throw new Error('Invalid district. Expected A, B, or C');
    }
    
    if (!menu || !menu.items || !Array.isArray(menu.items) || menu.items.length === 0) {
      throw new Error('Menu must have at least one item');
    }
    
    if (!nutrition || typeof nutrition.energy !== 'number' || nutrition.energy <= 0) {
      throw new Error('Nutrition energy must be a positive number');
    }
  }

  /**
   * 日付形式の検証
   */
  isValidDate(dateString) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const date = new Date(dateString);
    return date.toISOString().split('T')[0] === dateString;
  }

  /**
   * 地区の検証
   */
  isValidDistrict(district) {
    return ['A', 'B', 'C'].includes(district);
  }

  /**
   * ドキュメントID生成
   */
  getDocumentId() {
    return `${this.date}-${this.district}`;
  }

  /**
   * 特別メニューかどうか判定
   */
  isSpecial() {
    return this.hasSpecialMenu || this.menu.items.some(item => 
      item.includes('★') || item.includes('⭐') || item.includes('特別')
    );
  }

  /**
   * カロリー取得
   */
  getCalories() {
    return this.nutrition?.energy || 0;
  }

  /**
   * タンパク質取得
   */
  getProtein() {
    return this.nutrition?.protein || 0;
  }

  /**
   * メニュー説明文取得
   */
  getMenuDescription() {
    return this.menu?.description || this.menu?.items?.join('、') || '';
  }

  /**
   * 曜日の取得（日本語）
   */
  getDayOfWeekJP() {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    const date = new Date(this.date);
    return days[date.getDay()];
  }

  /**
   * 地区名の取得（日本語）
   */
  getDistrictNameJP() {
    const districts = {
      'A': '川崎区・中原区',
      'B': '幸区・多摩区・麻生区', 
      'C': '高津区・宮前区'
    };
    return districts[this.district] || this.district;
  }

  /**
   * JSONシリアライゼーション
   */
  toJSON() {
    return {
      date: this.date,
      district: this.district,
      dayOfWeek: this.dayOfWeek,
      menu: this.menu,
      nutrition: this.nutrition,
      hasSpecialMenu: this.hasSpecialMenu,
      notes: this.notes
    };
  }

  /**
   * APIレスポンス用フォーマット
   */
  toApiResponse() {
    return {
      ...this.toJSON(),
      documentId: this.getDocumentId(),
      isSpecial: this.isSpecial(),
      dayOfWeekJP: this.getDayOfWeekJP(),
      districtNameJP: this.getDistrictNameJP(),
      menuDescription: this.getMenuDescription()
    };
  }

  /**
   * Factory method - 生データから作成
   */
  static fromFirestoreData(data) {
    if (!data) return null;
    
    return new Menu({
      date: data.date,
      district: data.district,
      dayOfWeek: data.dayOfWeek,
      menu: data.menu,
      nutrition: data.nutrition,
      hasSpecialMenu: data.hasSpecialMenu,
      notes: data.notes
    });
  }

  /**
   * Factory method - APIクエリから作成
   */
  static fromApiQuery({ date, district }) {
    const menu = new Date(date);
    const dayOfWeek = menu.getDayOfWeekJP();
    
    return new Menu({
      date,
      district,
      dayOfWeek,
      menu: { items: [], description: '' },
      nutrition: { energy: 0, protein: 0 }
    });
  }
}

export default Menu;