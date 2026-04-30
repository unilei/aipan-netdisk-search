// 智能缓存管理 composable
export const useSmartCache = () => {
  // 简化缓存类
  class SmartCache {
    constructor({
      namespace = "smart-cache",
      maxSize = 100,
      useRedis = true,
    } = {}) {
      this.namespace = namespace;
      this.maxSize = maxSize;
      this.cache = new Map();
      this.useRedis = useRedis;
      this.ttlConfig = {
        search: 5 * 60 * 1000, // 搜索结果缓存5分钟
        config: 24 * 60 * 60 * 1000, // 配置信息缓存24小时
        default: 60 * 60 * 1000, // 默认1小时
      };

      if (import.meta.client) {
        this.init();
      }
    }

    init() {
      if (!import.meta.client) return;
      try {
        this.load();
        this.setupAutoSave();
        this.setupCleanupInterval();
      } catch (error) {
        console.error("Error initializing cache:", error);
      }
    }

    load() {
      if (!import.meta.client) return;
      try {
        const savedData = localStorage.getItem(this.namespace);
        if (savedData) {
          const { cache } = JSON.parse(savedData);
          this.cache.clear();
          if (Array.isArray(cache)) {
            cache.forEach(([key, value]) => {
              this.cache.set(key, value);
            });
          } else if (typeof cache === "object") {
            Object.keys(cache).forEach((key) => {
              this.cache.set(key, cache[key]);
            });
          }
        }
      } catch (error) {
        console.error("Error loading cache:", error);
        this.cache.clear();
      }
    }

    save() {
      if (!import.meta.client) return;
      try {
        const data = {
          cache: Array.from(this.cache.entries()),
          timestamp: Date.now(),
        };
        localStorage.setItem(this.namespace, JSON.stringify(data));
      } catch (error) {
        this.cleanup(true);
        try {
          localStorage.setItem(
            this.namespace,
            JSON.stringify({
              cache: Array.from(this.cache.entries()),
              timestamp: Date.now(),
            })
          );
        } catch (error) {
          console.error("Failed to save cache:", error);
        }
      }
    }

    setupAutoSave() {
      if (!import.meta.client) return;
      this.saveInterval = setInterval(() => this.save(), 60000);
      this.beforeUnloadHandler = () => {
        this.save();
        this.cleanup();
      };
      window.addEventListener("beforeunload", this.beforeUnloadHandler);
    }

    setupCleanupInterval() {
      if (!import.meta.client) return;
      this.cleanupInterval = setInterval(() => this.cleanup(), 300000);
    }

    // 清理所有定时器和事件监听器
    destroy() {
      if (!import.meta.client) return;

      if (this.saveInterval) {
        clearInterval(this.saveInterval);
        this.saveInterval = null;
      }

      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
        this.cleanupInterval = null;
      }

      if (this.beforeUnloadHandler) {
        window.removeEventListener("beforeunload", this.beforeUnloadHandler);
        this.beforeUnloadHandler = null;
      }

      this.cache.clear();
    }

    isStale(cacheItem, type = "default") {
      if (!cacheItem) return true;
      const ttl = this.ttlConfig[type] || this.ttlConfig.default;
      return Date.now() > cacheItem.timestamp + ttl;
    }

    getTTL(type = "default", value = null) {
      return this.ttlConfig[type] || this.ttlConfig.default;
    }

    getCacheType(key) {
      if (key.includes("config") || key.includes("setting"))
        return "config";
      return "search";
    }

    parseCacheKey(key) {
      try {
        const matches = key.match(/^(.+?)-(.+)$/);
        if (matches && matches.length === 3) {
          const [, api, encodedKeyword] = matches;
          return {
            category: "search",
            source: api,
            keyword: decodeURIComponent(encodedKeyword),
          };
        }
      } catch (error) {
        console.error("Error parsing cache key:", error);
      }
      return { category: "unknown", source: "unknown", keyword: "" };
    }

    cleanup(force = false) {
      if (!import.meta.client) return;

      const now = Date.now();
      const keysToDelete = [];

      for (const [key, value] of this.cache.entries()) {
        const type = this.getCacheType(key);
        if (force || this.isStale(value, type)) {
          keysToDelete.push(key);
        }
      }

      keysToDelete.forEach((key) => this.cache.delete(key));

      // 如果缓存过大，删除最旧的条目
      if (this.cache.size > this.maxSize) {
        const entries = Array.from(this.cache.entries());
        entries.sort((a, b) => (a[1].timestamp || 0) - (b[1].timestamp || 0));
        const toDelete = entries.slice(0, this.cache.size - this.maxSize);
        toDelete.forEach(([key]) => this.cache.delete(key));
      }

      this.save();
    }

    async getWithStrategy(key) {
      const type = this.getCacheType(key);
      const localData = this.cache.get(key);

      if (localData && !this.isStale(localData, type)) {
        return localData.data;
      }

      return null;
    }

    async setWithStrategy(key, data, type = "default") {
      const cacheItem = {
        data,
        timestamp: Date.now(),
        type,
      };

      this.cache.set(key, cacheItem);

      // 异步保存，不阻塞主线程
      setTimeout(() => this.save(), 0);
    }
  }

  // 创建缓存实例
  const smartCache = new SmartCache();

  return {
    smartCache,
  };
};
