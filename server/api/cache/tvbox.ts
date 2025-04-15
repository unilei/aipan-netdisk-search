import { getRedisClient, setDataInRedis, getDataFromRedis, deleteDataFromRedis } from '~/server/utils/redis';

// 缓存键前缀
const CACHE_KEY_PREFIX = 'tvbox';
// 默认缓存时间（1天，单位：秒）
const DEFAULT_TTL = 86400;

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const action = query.action as string || 'get';
    
    // 构建缓存键
    const cacheKey = `${CACHE_KEY_PREFIX}`;
    
    switch (action) {
      case 'get':
        // 从Redis获取数据
        const data = await getDataFromRedis(cacheKey);
        return {
          code: 200,
          message: data ? 'Cache hit' : 'Cache miss',
          data: data
        };
        
      case 'set':
        // 设置缓存数据
        const bodyContent = await readBody(event);
        const ttl = query.ttl ? parseInt(query.ttl as string) : DEFAULT_TTL;
        
        // 将数据保存到Redis
        await setDataInRedis(cacheKey, bodyContent, ttl);
        
        return {
          code: 200,
          message: 'Cache set successfully'
        };
        
      case 'delete':
        // 删除缓存
        await deleteDataFromRedis(cacheKey);
        return {
          code: 200,
          message: 'Cache deleted successfully'
        };
        
      case 'info':
        // 获取缓存信息
        const client = await getRedisClient();
        const ttlRemaining = await client.ttl(cacheKey);
        const exists = await client.exists(cacheKey);
        
        return {
          code: 200,
          data: {
            exists: exists === 1,
            ttl: ttlRemaining
          }
        };
        
      default:
        return {
          code: 400,
          message: 'Invalid action'
        };
    }
  } catch (error) {
    console.error('Error in tvbox cache API:', error);
    return {
      code: 500,
      message: `Cache error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
});
