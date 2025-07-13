import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase/config';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { district = 'A' } = req.query;
    const today = new Date().toISOString().split('T')[0];
    const docId = `${today}-${district}`;
    
    const docRef = doc(db, 'kawasaki_menus', docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      res.status(200).json({
        success: true,
        data: docSnap.data()
      });
    } else {
      res.status(404).json({
        success: false,
        message: '今日の給食データが見つかりません'
      });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
