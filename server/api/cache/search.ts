import { getDataFromRedis, setDataInRedis, deleteDataFromRedis } from '~/server/utils/redis';

// 辅助函数：将任何错误转换为字符串
function errorToString(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const { action, key, category, source, keyword } = query;
  
  // 生成缓存键，如果提供了特定key则用key，否则根据分类、来源和关键词生成
  const cacheKey = key ? 
    `search:${key}` : 
    `search:${category || 'all'}:${source || 'all'}:${keyword || ''}`;
  
  // 缓存有效期默认为1天
  const cacheTTL = 60 * 60 * 24;
  
  // 根据不同的action执行相应操作
  if (action === 'get') {
    try {
      const data = await getDataFromRedis(cacheKey);
      return {
        code: 200,
        data,
        source: data ? 'redis-cache' : null
      };
    } catch (err: unknown) {
      const errorMessage = errorToString(err);
      console.error('Error getting search cache from Redis:', errorMessage);
      return {
        code: 500,
        msg: 'Failed to get search cache',
        error: errorMessage
      };
    }
  } else if (action === 'set') {
    try {
      const body = await readBody(event);
      const { data, ttl } = body;
      
      if (!data) {
        return {
          code: 400,
          msg: 'Data is required'
        };
      }
      
      // 设置缓存，使用自定义TTL或默认值
      await setDataInRedis(cacheKey, data, ttl || cacheTTL);
      
      return {
        code: 200,
        msg: 'Cache set successfully'
      };
    } catch (err: unknown) {
      const errorMessage = errorToString(err);
      console.error('Error setting search cache in Redis:', errorMessage);
      return {
        code: 500,
        msg: 'Failed to set search cache',
        error: errorMessage
      };
    }
  } else if (action === 'delete') {
    try {
      await deleteDataFromRedis(cacheKey);
      return {
        code: 200,
        msg: 'Cache deleted successfully'
      };
    } catch (err: unknown) {
      const errorMessage = errorToString(err);
      console.error('Error deleting search cache from Redis:', errorMessage);
      return {
        code: 500,
        msg: 'Failed to delete search cache',
        error: errorMessage
      };
    }
  } else if (action === 'info') {
    // 此功能可以进一步扩展，添加缓存统计信息
    return {
      code: 200,
      data: {
        keyPattern: cacheKey,
        defaultTTL: cacheTTL
      }
    };
  }
  
  return {
    code: 400,
    msg: 'Invalid action'
  };
});
