import { createClient } from 'redis';

let redisClient: any = null;

export const getRedisClient = async () => {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    redisClient.on('error', (err: any) => {
      console.error('Redis client error:', err);
    });

    await redisClient.connect();
  }

  return redisClient;
};

// 用于在Redis中设置数据，支持过期时间设置
export const setDataInRedis = async (key: string, data: any, expirationInSeconds = 86400) => {
  try {
    const client = await getRedisClient();
    await client.set(key, JSON.stringify(data), {
      EX: expirationInSeconds,
    });
    return true;
  } catch (error) {
    console.error('Error setting data in Redis:', error);
    return false;
  }
};

// 从Redis获取数据
export const getDataFromRedis = async (key: string) => {
  try {
    const client = await getRedisClient();
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting data from Redis:', error);
    return null;
  }
};

// 删除Redis中的数据
export const deleteDataFromRedis = async (key: string) => {
  try {
    const client = await getRedisClient();
    await client.del(key);
    return true;
  } catch (error) {
    console.error('Error deleting data from Redis:', error);
    return false;
  }
};
