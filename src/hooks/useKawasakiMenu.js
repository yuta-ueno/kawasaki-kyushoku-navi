import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase/config';

// JST基準で今日の日付を取得するヘルパー関数
const getTodayJST = () => {
  const now = new Date();
  const jstDate = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9時間
  return jstDate.toISOString().split('T')[0];
};

// 今日の献立を取得
export const useTodayMenu = (district = 'A') => {
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTodayMenu = async () => {
      try {
        setLoading(true);
        // ここだけ変更: UTC → JST基準
        const today = getTodayJST();
        const docId = `${today}-${district}`;
        const docRef = doc(db, 'kawasaki_menus', docId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setMenu(docSnap.data());
        } else {
          setMenu(null);
        }
        setError(null);
      } catch (err) {
        console.error('今日の献立取得エラー:', err);
        setError(err.message);
        setMenu(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTodayMenu();
  }, [district]);

  return { menu, loading, error };
};

// 月間献立一覧を取得（変更なし）
export const useMonthlyMenus = (year = 2025, month = 7, district = 'A') => {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMonthlyMenus = async () => {
      try {
        setLoading(true);
        const menusRef = collection(db, 'kawasaki_menus');
        const q = query(
          menusRef,
          where('year', '==', year),
          where('month', '==', month),
          where('district', '==', district),
          orderBy('date', 'asc')
        );
        
        const querySnapshot = await getDocs(q);
        const menuList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setMenus(menuList);
        setError(null);
      } catch (err) {
        console.error('月間献立取得エラー:', err);
        setError(err.message);
        setMenus([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyMenus();
  }, [year, month, district]);

  return { menus, loading, error };
};
