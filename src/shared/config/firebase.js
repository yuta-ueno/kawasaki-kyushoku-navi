// Firebase設定
import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

// Firebase初期化
const app = initializeApp(firebaseConfig)

// Firestore初期化
const db = getFirestore(app)

// 開発環境でのエミュレーター接続（オプション）
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // エミュレーターを使用する場合のみコメントアウトを外す
  // connectFirestoreEmulator(db, 'localhost', 8080)
}

export { db }
export default app
