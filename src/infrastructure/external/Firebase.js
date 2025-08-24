/**
 * Infrastructure: Firebase External Service
 * Firebase接続の統一管理
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

class FirebaseService {
  constructor() {
    this.app = null;
    this.db = null;
    this.initialized = false;
  }

  /**
   * Firebase初期化
   */
  initialize() {
    if (this.initialized) {
      return { app: this.app, db: this.db };
    }

    try {
      // 設定値の検証
      this.validateConfig();

      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
      };

      // Firebase初期化
      this.app = initializeApp(firebaseConfig);
      this.db = getFirestore(this.app);

      // 開発環境でのエミュレーター接続（必要に応じて）
      this.setupEmulator();

      this.initialized = true;

      console.log('Firebase initialized successfully');
      return { app: this.app, db: this.db };
    } catch (error) {
      console.error('Firebase initialization failed:', error);
      throw new Error(`Firebase initialization failed: ${error.message}`);
    }
  }

  /**
   * 設定値の検証
   */
  validateConfig() {
    const requiredEnvVars = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'NEXT_PUBLIC_FIREBASE_APP_ID'
    ];

    const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

    if (missingVars.length > 0) {
      throw new Error(`Missing Firebase environment variables: ${missingVars.join(', ')}`);
    }
  }

  /**
   * エミュレーター設定
   */
  setupEmulator() {
    if (process.env.NODE_ENV === 'development' && 
        typeof window !== 'undefined' && 
        process.env.USE_FIREBASE_EMULATOR === 'true') {
      
      try {
        connectFirestoreEmulator(this.db, 'localhost', 8080);
        console.log('Connected to Firestore Emulator');
      } catch (error) {
        // エミュレーターが既に接続済みの場合はエラーを無視
        if (!error.message.includes('already been called')) {
          console.warn('Failed to connect to Firestore Emulator:', error);
        }
      }
    }
  }

  /**
   * 接続状態確認
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * Firebase App取得
   */
  getApp() {
    if (!this.initialized) {
      this.initialize();
    }
    return this.app;
  }

  /**
   * Firestore DB取得
   */
  getDb() {
    if (!this.initialized) {
      this.initialize();
    }
    return this.db;
  }

  /**
   * 接続テスト
   */
  async testConnection() {
    try {
      if (!this.initialized) {
        this.initialize();
      }

      // Firestoreへの簡単なクエリでテスト
      const { doc, getDoc } = await import('firebase/firestore');
      const testDocRef = doc(this.db, 'test', 'connection');
      await getDoc(testDocRef);
      
      return { success: true, message: 'Firebase connection successful' };
    } catch (error) {
      return { success: false, message: `Firebase connection failed: ${error.message}` };
    }
  }

  /**
   * 設定情報取得（デバッグ用）
   */
  getConfig() {
    return {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      environment: process.env.NODE_ENV,
      emulatorEnabled: process.env.USE_FIREBASE_EMULATOR === 'true',
      initialized: this.initialized
    };
  }

  /**
   * リソースクリーンアップ
   */
  cleanup() {
    try {
      // Firebase のクリーンアップ処理（必要に応じて）
      this.initialized = false;
      console.log('Firebase service cleaned up');
    } catch (error) {
      console.error('Error during Firebase cleanup:', error);
    }
  }
}

// シングルトンインスタンス
const firebaseService = new FirebaseService();

// 初期化を実行
const { app, db } = firebaseService.initialize();

// エクスポート
export { app, db, firebaseService };
export default firebaseService;