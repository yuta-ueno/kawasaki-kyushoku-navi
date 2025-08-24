/**
 * Infrastructure: Firebase Menu Repository
 * Firestore を使用したメニューデータアクセス実装
 */

import { doc, getDoc, collection, query, where, orderBy, getDocs, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../external/Firebase.js';
import { Menu } from '../../domain/entities/Menu.js';
import { MenuRepository } from '../../domain/repositories/MenuRepository.js';

export class FirebaseMenuRepository extends MenuRepository {
  constructor() {
    super();
    this.collectionName = 'kawasaki_menus';
  }

  /**
   * 今日の給食メニュー取得
   */
  async getTodayMenu(date, district) {
    try {
      const docId = `${date}-${district}`;
      const docRef = doc(db, this.collectionName, docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return Menu.fromFirestoreData(docSnap.data());
      }

      return null;
    } catch (error) {
      throw new Error(`Firebase error getting today's menu: ${error.message}`);
    }
  }

  /**
   * 月間給食メニュー取得
   */
  async getMonthlyMenus(year, month, district) {
    try {
      // 月の開始日と終了日を計算
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      const endDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;

      const q = query(
        collection(db, this.collectionName),
        where('district', '==', district),
        where('date', '>=', startDate),
        where('date', '<', endDate),
        orderBy('date', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const menus = [];

      querySnapshot.forEach((doc) => {
        const menu = Menu.fromFirestoreData(doc.data());
        if (menu) {
          menus.push(menu);
        }
      });

      return menus;
    } catch (error) {
      throw new Error(`Firebase error getting monthly menus: ${error.message}`);
    }
  }

  /**
   * 給食メニュー保存
   */
  async saveMenu(menu) {
    try {
      const docId = menu.getDocumentId();
      const docRef = doc(db, this.collectionName, docId);
      
      await setDoc(docRef, menu.toJSON());
      return true;
    } catch (error) {
      throw new Error(`Firebase error saving menu: ${error.message}`);
    }
  }

  /**
   * 給食メニュー削除
   */
  async deleteMenu(date, district) {
    try {
      const docId = `${date}-${district}`;
      const docRef = doc(db, this.collectionName, docId);
      
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      throw new Error(`Firebase error deleting menu: ${error.message}`);
    }
  }

  /**
   * 期間指定でのメニュー取得
   */
  async getMenusByDateRange(startDate, endDate, district) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('district', '==', district),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const menus = [];

      querySnapshot.forEach((doc) => {
        const menu = Menu.fromFirestoreData(doc.data());
        if (menu) {
          menus.push(menu);
        }
      });

      return menus;
    } catch (error) {
      throw new Error(`Firebase error getting menus by date range: ${error.message}`);
    }
  }

  /**
   * 複数メニューの一括保存（インポート用）
   */
  async bulkSaveMenus(menus) {
    try {
      const batch = writeBatch(db);
      let success = 0;
      let failed = 0;

      for (const menu of menus) {
        try {
          const docId = menu.getDocumentId();
          const docRef = doc(db, this.collectionName, docId);
          batch.set(docRef, menu.toJSON());
          success++;
        } catch (error) {
          console.error(`Error preparing menu for batch: ${error.message}`);
          failed++;
        }
      }

      if (success > 0) {
        await batch.commit();
      }

      return { success, failed };
    } catch (error) {
      throw new Error(`Firebase error bulk saving menus: ${error.message}`);
    }
  }

  /**
   * メニュー存在チェック
   */
  async menuExists(date, district) {
    try {
      const docId = `${date}-${district}`;
      const docRef = doc(db, this.collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      return docSnap.exists();
    } catch (error) {
      throw new Error(`Firebase error checking menu existence: ${error.message}`);
    }
  }

  /**
   * 地区別の全メニュー取得（管理者用）
   */
  async getAllMenusByDistrict(district, limit = null) {
    try {
      let q = query(
        collection(db, this.collectionName),
        where('district', '==', district),
        orderBy('date', 'desc')
      );

      if (limit) {
        q = query(q, limit(limit));
      }

      const querySnapshot = await getDocs(q);
      const menus = [];

      querySnapshot.forEach((doc) => {
        const menu = Menu.fromFirestoreData(doc.data());
        if (menu) {
          menus.push(menu);
        }
      });

      return menus;
    } catch (error) {
      throw new Error(`Firebase error getting all menus by district: ${error.message}`);
    }
  }

  /**
   * 特別メニューの取得
   */
  async getSpecialMenus(district, limit = 10) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('district', '==', district),
        where('hasSpecialMenu', '==', true),
        orderBy('date', 'desc')
      );

      if (limit) {
        q = query(q, limit(limit));
      }

      const querySnapshot = await getDocs(q);
      const menus = [];

      querySnapshot.forEach((doc) => {
        const menu = Menu.fromFirestoreData(doc.data());
        if (menu) {
          menus.push(menu);
        }
      });

      return menus;
    } catch (error) {
      throw new Error(`Firebase error getting special menus: ${error.message}`);
    }
  }

  /**
   * 栄養価検索
   */
  async searchMenusByCalories(minCalories, maxCalories, district) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('district', '==', district),
        where('nutrition.energy', '>=', minCalories),
        where('nutrition.energy', '<=', maxCalories),
        orderBy('nutrition.energy', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const menus = [];

      querySnapshot.forEach((doc) => {
        const menu = Menu.fromFirestoreData(doc.data());
        if (menu) {
          menus.push(menu);
        }
      });

      return menus;
    } catch (error) {
      throw new Error(`Firebase error searching menus by calories: ${error.message}`);
    }
  }
}

export default FirebaseMenuRepository;