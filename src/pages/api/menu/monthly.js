import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../../services/firebase/config';

// シンプルなレート制限実装（メモリベース）
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1分
const RATE_LIMIT_MAX_REQUESTS = 5; // 月間データは重いので1分間に5リクエスト

function checkRateLimit(ip) {
  const now = Date.now();
  const userRequests = rateLimitMap.get(ip) || [];
  
  // 1分以内のリクエストのみを保持
  const recentRequests = userRequests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  // 新しいリクエストを追加
  recentRequests.push(now);
  rateLimitMap.set(ip, recentRequests);
  
  // 古いエントリをクリーンアップ（メモリリーク防止）
  if (rateLimitMap.size > 1000) {
    const oldestKey = rateLimitMap.keys().next().value;
    rateLimitMap.delete(oldestKey);
  }
  
  return true;
}

export default async function handler(req, res) {
  try {
    // 1. HTTPメソッド制限
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // 2. レート制限チェック
    const clientIP = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress || 'unknown';
    if (!checkRateLimit(clientIP)) {
      return res.status(429).json({ 
        error: 'Too many requests',
        message: '1分間に5回までのリクエストに制限されています'
      });
    }

    // 3. Referrer チェック（本番環境のみ）
    if (process.env.NODE_ENV === 'production') {
      const allowedReferrers = [
        'https://kawasaki-kyushoku.jp',
        'https://kawasaki-lunch.vercel.app',
        'https://www.kawasaki-lunch.com'
      ];
      
      const referrer = req.headers.referer || req.headers.referrer;
      if (referrer && !allowedReferrers.some(allowed => referrer.startsWith(allowed))) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    // 4. 入力値検証
    const { 
      year = new Date().getFullYear(), 
      month = new Date().getMonth() + 1, 
      district = 'A' 
    } = req.query;

    // year の妥当性チェック（2020-2030年の範囲）
    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2030) {
      return res.status(400).json({
        error: 'Invalid year parameter',
        message: '年は2020年から2030年の間で指定してください'
      });
    }

    // month の妥当性チェック（1-12月）
    const monthNum = parseInt(month);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        error: 'Invalid month parameter',
        message: '月は1から12の間で指定してください'
      });
    }

    // district の妥当性チェック
    const allowedDistricts = ['A', 'B', 'C', '北部', '中部', '南部'];
    if (!allowedDistricts.includes(district)) {
      return res.status(400).json({
        error: 'Invalid district parameter',
        message: '地区は A, B, C, 北部, 中部, 南部 のいずれかを指定してください'
      });
    }

    // 5. データ取得処理
    const menusRef = collection(db, 'kawasaki_menus');
    const q = query(
      menusRef,
      where('year', '==', yearNum),
      where('month', '==', monthNum),
      where('district', '==', district),
      orderBy('date', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const menus = querySnapshot.docs.map(doc => {
      const data = doc.data();
      
      // 6. データサニタイゼーション - 安全なフィールドのみ返却
      return {
        id: doc.id,
        date: data.date,
        dayOfWeek: data.dayOfWeek,
        district: data.district,
        menu: data.menu,
        nutrition: data.nutrition,
        hasSpecialMenu: data.hasSpecialMenu,
        notes: data.notes,
        year: data.year,
        month: data.month
      };
    });

    // 7. データサイズ制限（大量データの防止）
    const maxResults = 50; // 最大50件まで
    const limitedMenus = menus.slice(0, maxResults);
    
    if (menus.length > maxResults) {
      console.warn(`Large dataset detected: ${menus.length} items, limited to ${maxResults}`);
    }
    
    // 8. レスポンス返却
    res.status(200).json({
      success: true,
      data: limitedMenus,
      count: limitedMenus.length,
      totalCount: menus.length,
      limited: menus.length > maxResults
    });

  } catch (error) {
    // 9. エラーハンドリング（本番環境では詳細なエラー情報を隠す）
    console.error('Monthly API Error:', error);
    
    if (process.env.NODE_ENV === 'production') {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}
