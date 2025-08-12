// lib/redis.js
import { Redis } from '@upstash/redis';

// Redisクライアントの初期化
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// 接続テスト用関数
export async function testRedisConnection() {
  try {
    await redis.set('test', 'connection-ok');
    const result = await redis.get('test');
    await redis.del('test');
    return result === 'connection-ok';
  } catch (error) {
    console.error('Redis connection test failed:', error);
    return false;
  }
}

// パフォーマンス監視用
export async function getRedisInfo() {
  try {
    const info = await redis.info();
    return info;
  } catch (error) {
    console.error('Redis info failed:', error);
    return null;
  }
}

export default redis;