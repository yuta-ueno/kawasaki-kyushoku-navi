import { writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

export const importKawasakiMenuData = async (menuData) => {
  try {
    // データ構造の検証
    if (!menuData || !menuData.metadata || !menuData.menus) {
      throw new Error('Invalid menu data structure');
    }
    
    console.log('給食データインポート開始...', {
      year: menuData.metadata.year,
      month: menuData.metadata.month,
      district: menuData.metadata.district,
      menuCount: menuData.menus.length
    });
    
    // Firebase接続テスト
    console.log('Firebase接続テスト...');
    try {
      const testDoc = doc(db, 'test', 'connection');
      console.log('Firebase接続正常');
    } catch (fbError) {
      console.error('Firebase接続エラー:', fbError);
      throw new Error(`Firebase接続失敗: ${fbError.message}`);
    }

    const batch = writeBatch(db);
    
    // 1. メタデータの保存
    const metadataId = `${menuData.metadata.year}-${menuData.metadata.month}-${menuData.metadata.district}`;
    const metadataRef = doc(db, 'kawasaki_menu_metadata', metadataId);
    batch.set(metadataRef, {
      ...menuData.metadata,
      importedAt: serverTimestamp(),
      dataVersion: '2.0'
    });
    
    // 2. 各献立データの保存
    menuData.menus.forEach(menu => {
      const menuId = `${menu.date}-${menu.district}`;
      const menuRef = doc(db, 'kawasaki_menus', menuId);
      
      batch.set(menuRef, {
        ...menu,
        year: menuData.metadata.year,
        month: menuData.metadata.month,
        schoolType: menuData.metadata.schoolType,
        energyRange: menu.nutrition?.energy >= 600 ? 'high' : 'normal',
        isSpecial: menu.hasSpecialMenu || false,
        importedAt: serverTimestamp()
      });
    });
    
    // 3. 学校マスタの更新
    const schoolMasterId = `${menuData.metadata.district}-${menuData.metadata.schoolType}`;
    const schoolRef = doc(db, 'kawasaki_schools', schoolMasterId);
    batch.set(schoolRef, {
      district: menuData.metadata.district,
      schoolType: menuData.metadata.schoolType,
      availableMonths: [`${menuData.metadata.year}-${String(menuData.metadata.month).padStart(2, '0')}`],
      lastUpdated: serverTimestamp()
    }, { merge: true });
    
    // 4. バッチ実行
    console.log('Firestoreバッチ書き込み開始...');
    try {
      await batch.commit();
      console.log('Firestoreバッチ書き込み完了');
    } catch (batchError) {
      console.error('バッチ書き込みエラー:', {
        message: batchError.message,
        code: batchError.code,
        stack: batchError.stack
      });
      throw batchError;
    }
    
    console.log('✅ 給食データインポート完了');
    return { 
      success: true, 
      count: menuData.menus.length,
      metadataId,
      details: {
        period: `${menuData.metadata.year}年${menuData.metadata.month}月`,
        district: menuData.metadata.district,
        schoolType: menuData.metadata.schoolType
      }
    };
    
  } catch (error) {
    console.error('❌ インポートエラー詳細:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      name: error.name
    });
    return { 
      success: false, 
      error: error.message,
      errorDetails: {
        code: error.code,
        name: error.name
      }
    };
  }
};
