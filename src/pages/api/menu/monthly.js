import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../../services/firebase/config';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      year = new Date().getFullYear(), 
      month = new Date().getMonth() + 1, 
      district = 'A' 
    } = req.query;

    const menusRef = collection(db, 'kawasaki_menus');
    const q = query(
      menusRef,
      where('year', '==', parseInt(year)),
      where('month', '==', parseInt(month)),
      where('district', '==', district),
      orderBy('date', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const menus = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.status(200).json({
      success: true,
      data: menus,
      count: menus.length
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
