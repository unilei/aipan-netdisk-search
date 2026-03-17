import { createClient } from 'redis';

const normalizeRedisUrl = (value?: string) => value?.trim().replace(/^['"]|['"]$/g, '') || '';

const REDIS_URL = normalizeRedisUrl(process.env.REDIS_URL);
const REDIS_CONNECT_TIMEOUT_MS = 1000;

let redisClient: any = null;
let redisConnectPromise: Promise<any | null> | null = null;
let redisUnavailable = false;
let hasLoggedRedisUnavailable = false;

const logRedisUnavailable = (message: string, error?: unknown) => {
  if (hasLoggedRedisUnavailable) {
    return;
  }

  hasLoggedRedisUnavailable = true;
  console.warn(message, error);
};

const createRedisConnection = () =>
  createClient({
    url: REDIS_URL,
    socket: {
      connectTimeout: REDIS_CONNECT_TIMEOUT_MS,
      reconnectStrategy: false,
    },
  });

export const getRedisClient = async () => {
  if (!REDIS_URL || redisUnavailable) {
    return null;
  }

  if (redisClient?.isOpen) {
    return redisClient;
  }

  if (redisConnectPromise) {
    return redisConnectPromise;
  }

  const client = createRedisConnection();
  client.on('error', () => {
    // The initial connect failure is handled below. Subsequent runtime errors
    // will be surfaced by the cache call that triggered them.
  });

  redisConnectPromise = client
    .connect()
    .then(() => {
      redisClient = client;
      return redisClient;
    })
    .catch((error: unknown) => {
      redisUnavailable = true;
      redisClient = null;
      logRedisUnavailable(
        `Redis is unavailable at ${REDIS_URL}. Cache operations will fall back to in-process behavior.`,
        error,
      );
      return null;
    })
    .finally(() => {
      redisConnectPromise = null;
    });

  return redisConnectPromise;
};

// 用于在Redis中设置数据，支持过期时间设置
export const setDataInRedis = async (key: string, data: any, expirationInSeconds = 86400) => {
  try {
    const client = await getRedisClient();
    if (!client) {
      return false;
    }

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
    if (!client) {
      return null;
    }

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
    if (!client) {
      return false;
    }

    await client.del(key);
    return true;
  } catch (error) {
    console.error('Error deleting data from Redis:', error);
    return false;
  }
};
