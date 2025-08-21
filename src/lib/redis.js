// lib/redis.js
import { Redis } from '@upstash/redis';

// =============================================================================
// デバッグ情報出力
// =============================================================================
console.log('=== Redis Configuration Debug ===');
console.log('Redis URL:', process.env.UPSTASH_REDIS_REST_URL ? 'SET' : 'NOT SET');
console.log('Redis Token:', process.env.UPSTASH_REDIS_REST_TOKEN ? 'SET' : 'NOT SET');

if (process.env.UPSTASH_REDIS_REST_URL) {
  console.log('URL Length:', process.env.UPSTASH_REDIS_REST_URL.length);
  console.log('URL Preview:', process.env.UPSTASH_REDIS_REST_URL.substring(0, 30) + '...');
}

if (process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.log('Token Length:', process.env.UPSTASH_REDIS_REST_TOKEN.length);
  console.log('Token Preview:', process.env.UPSTASH_REDIS_REST_TOKEN.substring(0, 10) + '...');
}

console.log('Node ENV:', process.env.NODE_ENV);
console.log('=====================================');

// =============================================================================
// Redisクライアントの初期化
// =============================================================================
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// =============================================================================
// 接続テスト用関数
// =============================================================================
export async function testRedisConnection() {
  try {
    console.log('Testing Redis connection...');
    await redis.set('test', 'connection-ok');
    const result = await redis.get('test');
    await redis.del('test');
    console.log('Redis connection test result:', result);
    return result === 'connection-ok';
  } catch (error) {
    console.error('Redis connection test failed:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      cause: error.cause,
      stack: error.stack?.split('\n').slice(0, 3)
    });
    return false;
  }
}

// =============================================================================
// パフォーマンス監視用
// =============================================================================
export async function getRedisInfo() {
  try {
    const info = await redis.info();
    return info;
  } catch (error) {
    console.error('Redis info failed:', error);
    return null;
  }
}

// =============================================================================
// レート制限専用関数（デバッグ付き）
// =============================================================================
export async function rateLimitIncrement(key, window = 60) {
  try {
    console.log('=== Rate Limit Debug ===');
    console.log('Key:', key);
    console.log('Window:', window);
    
    // Redis pipeline for atomic operations
    const pipeline = redis.pipeline();
    pipeline.incr(key);
    pipeline.expire(key, window);
    
    console.log('Executing Redis pipeline...');
    const results = await pipeline.exec();
    
    console.log('Pipeline results:', results);
    console.log('Results type:', typeof results);
    console.log('Results length:', results?.length);
    
    if (!results || !Array.isArray(results) || results.length < 2) {
      throw new Error('Invalid pipeline results structure');
    }
    
    // Upstash Redis の結果構造に対応
    let count;
    
    if (Array.isArray(results[0]) && results[0].length >= 2) {
      // 標準的なRedis client構造: [[error, result], [error, result]]
      const [incrResult, expireResult] = results;
      console.log('Standard Redis format detected');
      console.log('Increment result:', incrResult);
      console.log('Expire result:', expireResult);
      count = incrResult[1];
    } else {
      // Upstash Redis構造: [result, result]
      console.log('Upstash Redis format detected');
      console.log('Increment result:', results[0]);
      console.log('Expire result:', results[1]);
      count = results[0];
    }
    
    console.log('Extracted count:', count);
    console.log('Count type:', typeof count);
    
    if (typeof count !== 'number' || isNaN(count)) {
      throw new Error(`Invalid count value: ${count} (type: ${typeof count})`);
    }
    
    return count;
    
  } catch (error) {
    console.error('Redis rate limit error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      cause: error.cause
    });
    
    // フォールバック: エラー時は0を返す
    return 0;
  }
}

export default redis;