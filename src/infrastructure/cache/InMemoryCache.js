/**
 * Infrastructure: In-Memory Cache Service
 * メモリベースの簡易キャッシュ実装
 */

export class InMemoryCache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  /**
   * キャッシュに値を設定
   * @param {string} key 
   * @param {any} value 
   * @param {number} ttl - Time to live in seconds
   */
  async set(key, value, ttl = 300) {
    try {
      // 既存のタイマーをクリア
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key));
      }

      // 値を保存
      this.cache.set(key, {
        value,
        createdAt: Date.now(),
        ttl: ttl * 1000 // milliseconds
      });

      // TTL タイマーを設定
      if (ttl > 0) {
        const timer = setTimeout(() => {
          this.delete(key);
        }, ttl * 1000);
        
        this.timers.set(key, timer);
      }

      return true;
    } catch (error) {
      console.error('InMemoryCache set error:', error);
      return false;
    }
  }

  /**
   * キャッシュから値を取得
   * @param {string} key 
   * @returns {Promise<any|null>}
   */
  async get(key) {
    try {
      const cached = this.cache.get(key);
      
      if (!cached) {
        return null;
      }

      // TTL チェック
      const now = Date.now();
      const elapsed = now - cached.createdAt;
      
      if (elapsed > cached.ttl) {
        this.delete(key);
        return null;
      }

      return cached.value;
    } catch (error) {
      console.error('InMemoryCache get error:', error);
      return null;
    }
  }

  /**
   * キャッシュから値を削除
   * @param {string} key 
   */
  async delete(key) {
    try {
      // タイマーをクリア
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key));
        this.timers.delete(key);
      }

      // キャッシュから削除
      return this.cache.delete(key);
    } catch (error) {
      console.error('InMemoryCache delete error:', error);
      return false;
    }
  }

  /**
   * キャッシュをクリア
   */
  async clear() {
    try {
      // すべてのタイマーをクリア
      for (const timer of this.timers.values()) {
        clearTimeout(timer);
      }
      
      this.timers.clear();
      this.cache.clear();
      
      return true;
    } catch (error) {
      console.error('InMemoryCache clear error:', error);
      return false;
    }
  }

  /**
   * キャッシュ統計情報
   */
  getStats() {
    const now = Date.now();
    let expiredCount = 0;
    let validCount = 0;
    let totalSize = 0;

    for (const [key, cached] of this.cache.entries()) {
      const elapsed = now - cached.createdAt;
      
      if (elapsed > cached.ttl) {
        expiredCount++;
      } else {
        validCount++;
      }
      
      totalSize += this.estimateSize(cached.value);
    }

    return {
      totalEntries: this.cache.size,
      validEntries: validCount,
      expiredEntries: expiredCount,
      estimatedSizeBytes: totalSize,
      timersActive: this.timers.size
    };
  }

  /**
   * オブジェクトサイズの推定
   */
  estimateSize(obj) {
    try {
      return JSON.stringify(obj).length * 2; // UTF-16で2バイト概算
    } catch (error) {
      return 0;
    }
  }

  /**
   * 期限切れエントリの手動クリーンアップ
   */
  cleanup() {
    const now = Date.now();
    const keysToDelete = [];

    for (const [key, cached] of this.cache.entries()) {
      const elapsed = now - cached.createdAt;
      
      if (elapsed > cached.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.delete(key));
    
    return keysToDelete.length;
  }

  /**
   * キーの存在確認
   */
  async has(key) {
    const value = await this.get(key);
    return value !== null;
  }

  /**
   * キーの一覧取得
   */
  keys() {
    return Array.from(this.cache.keys());
  }

  /**
   * キャッシュサイズ取得
   */
  size() {
    return this.cache.size;
  }

  /**
   * 複数のキーを一度に取得
   */
  async getMultiple(keys) {
    const results = {};
    
    for (const key of keys) {
      results[key] = await this.get(key);
    }
    
    return results;
  }

  /**
   * 複数のキーを一度に設定
   */
  async setMultiple(entries, ttl = 300) {
    const results = {};
    
    for (const [key, value] of Object.entries(entries)) {
      results[key] = await this.set(key, value, ttl);
    }
    
    return results;
  }

  /**
   * プレフィックスによるキー検索
   */
  getKeysByPrefix(prefix) {
    return this.keys().filter(key => key.startsWith(prefix));
  }

  /**
   * プレフィックスによる一括削除
   */
  async deleteByPrefix(prefix) {
    const keys = this.getKeysByPrefix(prefix);
    let deletedCount = 0;
    
    for (const key of keys) {
      if (await this.delete(key)) {
        deletedCount++;
      }
    }
    
    return deletedCount;
  }
}

// シングルトンインスタンス（開発環境用）
let cacheInstance = null;

export function getCacheInstance() {
  if (!cacheInstance) {
    cacheInstance = new InMemoryCache();
  }
  return cacheInstance;
}

export default InMemoryCache;