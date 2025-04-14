import { getDataFromRedis, setDataInRedis } from '~/server/utils/redis';

export default defineEventHandler(async (event) => {
  const REDIS_KEY_PREFIX = 'home_category_';
  const CACHE_EXPIRATION = 60 * 60 * 24 * 7; // 7天缓存时间
  
  // 从查询参数获取操作类型和分类ID
  const query = getQuery(event);
  const { action, categoryId } = query;
  
  if (action === 'get') {
    // 获取缓存的分类ID
    try {
      const cachedCategory = await getDataFromRedis(`${REDIS_KEY_PREFIX}active`);
      return {
        code: 200,
        data: cachedCategory,
      };
    } catch (error) {
      console.error('Error getting category from Redis:', error);
      return {
        code: 500,
        msg: 'Failed to get category',
      };
    }
  } else if (action === 'set' && categoryId) {
    // 设置活跃分类ID
    try {
      await setDataInRedis(`${REDIS_KEY_PREFIX}active`, categoryId, CACHE_EXPIRATION);
      return {
        code: 200,
        msg: 'Category set successfully',
      };
    } catch (error) {
      console.error('Error setting category in Redis:', error);
      return {
        code: 500,
        msg: 'Failed to set category',
      };
    }
  }
  
  return {
    code: 400,
    msg: 'Invalid action',
  };
});
