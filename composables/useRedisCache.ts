/**
 * Redis缓存工具
 * 提供与Redis缓存服务器交互的方法
 */

interface CacheResponse {
  code: number;
  data?: any;
  msg?: string;
  source?: string | null;
  error?: any;
}

export function useRedisCache() {
  // 从Redis获取缓存
  const getCache = async (options: {
    category?: string;
    source?: string;
    keyword?: string;
    key?: string;
  }) => {
    try {
      const { category, source, keyword, key } = options;
      
      const res = await $fetch<CacheResponse>('/api/cache/search', {
        method: 'GET',
        query: {
          action: 'get',
          key,
          category,
          source,
          keyword
        }
      });
      
      if (res.code === 200 && res.data) {
        return {
          data: res.data,
          source: 'redis'
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching from Redis cache:', error);
      return null;
    }
  };
  
  // 设置Redis缓存
  const setCache = async (options: {
    data: any;
    category?: string;
    source?: string;
    keyword?: string;
    key?: string;
    ttl?: number;
  }) => {
    try {
      const { data, category, source, keyword, key, ttl } = options;
      
      await $fetch<CacheResponse>('/api/cache/search', {
        method: 'POST',
        query: {
          action: 'set',
          key,
          category,
          source,
          keyword
        },
        body: {
          data,
          ttl
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error setting Redis cache:', error);
      return false;
    }
  };
  
  // 删除Redis缓存
  const deleteCache = async (options: {
    category?: string;
    source?: string;
    keyword?: string;
    key?: string;
  }) => {
    try {
      const { category, source, keyword, key } = options;
      
      await $fetch<CacheResponse>('/api/cache/search', {
        method: 'GET',
        query: {
          action: 'delete',
          key,
          category,
          source,
          keyword
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting Redis cache:', error);
      return false;
    }
  };
  
  // 获取Redis缓存信息
  const getCacheInfo = async (options: {
    category?: string;
    source?: string;
    keyword?: string;
    key?: string;
  }) => {
    try {
      const { category, source, keyword, key } = options;
      
      const res = await $fetch<CacheResponse>('/api/cache/search', {
        method: 'GET',
        query: {
          action: 'info',
          key,
          category,
          source,
          keyword
        }
      });
      
      if (res.code === 200 && res.data) {
        return res.data;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting Redis cache info:', error);
      return null;
    }
  };
  
  return {
    getCache,
    setCache,
    deleteCache,
    getCacheInfo
  };
}
