import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase/config';

// シンプルなレート制限実装（メモリベース）
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1分
const RATE_LIMIT_MAX_REQUESTS = 10; // 1分間に10リクエスト

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
        message: '1分間に10回までのリクエストに制限されています'
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
    const { district = 'A' } = req.query;
    
    // district の妥当性チェック
    const allowedDistricts = ['A', 'B', 'C', '北部', '中部', '南部'];
    if (!allowedDistricts.includes(district)) {
      return res.status(400).json({
        error: 'Invalid district parameter',
        message: '地区は A, B, C, 北部, 中部, 南部 のいずれかを指定してください'
      });
    }

    // 5. データ取得処理
    const today = new Date().toISOString().split('T')[0];
    const docId = `${today}-${district}`;
    
    const docRef = doc(db, 'kawasaki_menus', docId);
    const docSnap = await getDoc(docRef);
    
    // 6. レスポンス返却
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // セキュリティ: 不要なメタデータを除去
      const sanitizedData = {
        date: data.date,
        dayOfWeek: data.dayOfWeek,
        district: data.district,
        menu: data.menu,
        nutrition: data.nutrition,
        hasSpecialMenu: data.hasSpecialMenu,
        notes: data.notes
      };

      res.status(200).json({
        success: true,
        data: sanitizedData
      });
    } else {
      res.status(404).json({
        success: false,
        message: '今日の給食データが見つかりません'
      });
    }

  } catch (error) {
    // 7. エラーハンドリング（本番環境では詳細なエラー情報を隠す）
    console.error('API Error:', error);
    
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
