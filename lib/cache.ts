import { LRUCache } from 'lru-cache';
import { EventEmitter } from 'events';
import { ConcurrencyController } from './concurrency';
import { PersistenceManager, PersistenceOptions } from './persistence';

interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
}

interface CacheOptions {
  max?: number;
  ttl?: number;
  maxConcurrent?: number;
  maxMemoryUsage?: number; // 最大内存使用量（字节）
  persistence?: PersistenceOptions;
  warmup?: {
    key: string;
    fetcher: () => Promise<any>;
    ttl?: number;
    retryOptions?: RetryOptions;
    refreshInterval?: number;
    priority?: number; // Higher number means higher priority
  }[];
}

interface CacheStats {
  size: number;
  maxSize: number;
  hits: number;
  misses: number;
  errors: number;
  avgFetchTime: number;
  hitRate: number;
  missRate: number;
  memoryUsage: number;
  warmupStats: {
    totalTime: number;
    successCount: number;
    failureCount: number;
    averageWarmupTime: number;
  };
  concurrency: {
    running: number;
    queued: number;
    maxConcurrent: number;
  };
  persistence?: {
    totalSize: number;
    fileCount: number;
    oldestFile: Date | null;
    newestFile: Date | null;
  };
}

interface CacheMetrics {
  fetchTimes: number[];
  errors: number;
  lastError?: Error;
  lastErrorTime?: Date;
}

export class QueryCache extends EventEmitter {
  private cache: LRUCache<string, any>;
  private hitCounter: number = 0;
  private missCounter: number = 0;
  private warmupPromise: Promise<void> | null = null;
  private refreshIntervals: Map<string, NodeJS.Timeout> = new Map();
  private metrics: Map<string, CacheMetrics> = new Map();
  private readonly MAX_FETCH_TIMES = 100;
  private concurrencyController: ConcurrencyController;
  private persistenceManager?: PersistenceManager;
  private warmupStats = {
    startTime: 0,
    endTime: 0,
    successCount: 0,
    failureCount: 0,
    warmupTimes: [] as number[]
  };
  private memoryWatcher = setInterval(() => {
    const memoryUsage = process.memoryUsage();
    if (memoryUsage.heapUsed > this.maxMemoryUsage) {
      this.triggerMemoryOptimization();
    }
  }, 60000);
  private maxMemoryUsage = 1024 * 1024 * 1024; // 1GB default limit

  constructor(options: CacheOptions = {}) {
    super();
    this.cache = new LRUCache({
      max: options.max || 100,
      ttl: options.ttl || 1000 * 60 * 5,
      updateAgeOnGet: true,
      maxSize: options.maxMemoryUsage || this.maxMemoryUsage,
      sizeCalculation: (value) => {
        return Buffer.byteLength(JSON.stringify(value));
      }
    });

    this.concurrencyController = new ConcurrencyController(
      options.maxConcurrent || 10
    );

    if (options.persistence) {
      this.persistenceManager = new PersistenceManager(options.persistence);
      this.initializePersistence();
    }

    if (options.warmup) {
      this.warmupPromise = this.warmupCache(options.warmup);
    }

    this.on('error', this.handleError.bind(this));
    this.on('fetch', this.recordFetchTime.bind(this));
  }

  private async initializePersistence() {
    if (!this.persistenceManager) return;
    
    try {
      await this.persistenceManager.initialize();
    } catch (error) {
      console.error('Failed to initialize persistence:', error);
      this.emit('error', { 
        key: 'persistence',
        error,
        operation: 'initialize'
      });
    }
  }

  private async warmupCache(warmupConfigs: CacheOptions['warmup']) {
    if (!warmupConfigs) return;

    this.warmupStats.startTime = Date.now();
    const sortedConfigs = [...warmupConfigs].sort((a, b) => 
      (b.priority ?? 0) - (a.priority ?? 0)
    );

    const warmupTasks = sortedConfigs.map(async (config) => {
      const startTime = Date.now();
      try {
        await this.concurrencyController.add(
          async () => {
            const value = await this.timedFetch(config.key, config.fetcher);
            await this.set(config.key, value, { ttl: config.ttl });
            
            if (config.refreshInterval) {
              this.setupRefreshInterval(
                config.key,
                config.fetcher,
                config.ttl,
                config.refreshInterval,
                config.retryOptions
              );
            }
            this.warmupStats.successCount++;
            this.warmupStats.warmupTimes.push(Date.now() - startTime);
          },
          config.priority ?? 0
        );
      } catch (error) {
        this.warmupStats.failureCount++;
        this.emit('error', { 
          key: config.key, 
          error, 
          operation: 'warmup',
          duration: Date.now() - startTime
        });
        console.error(`Failed to warmup cache for key ${config.key}:`, error);
      }
    });

    await Promise.all(warmupTasks);
    this.warmupStats.endTime = Date.now();
  }

  private setupRefreshInterval(
    key: string,
    fetcher: () => Promise<any>,
    ttl?: number,
    interval: number = 1000 * 60 * 5,
    retryOptions?: RetryOptions
  ) {
    if (this.refreshIntervals.has(key)) {
      clearInterval(this.refreshIntervals.get(key));
    }

    const timer = setInterval(async () => {
      try {
        await this.concurrencyController.add(async () => {
          await this.retryOperation(async () => {
            const value = await this.timedFetch(key, fetcher);
            await this.set(key, value, { ttl });
          }, retryOptions);
        });
      } catch (error) {
        this.emit('error', { key, error, operation: 'refresh' });
      }
    }, interval);

    this.refreshIntervals.set(key, timer);
  }

  private async retryOperation<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const { maxRetries = 3, retryDelay = 1000 } = options;
    let attempts = 0;

    while (attempts < maxRetries) {
      try {
        return await operation();
      } catch (error) {
        attempts++;
        if (attempts === maxRetries) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempts));
      }
    }
    throw new Error('Retry operation failed');
  }

  private async timedFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    try {
      const value = await fetcher();
      const fetchTime = Date.now() - startTime;
      this.emit('fetch', { key, time: fetchTime });
      return value;
    } catch (error) {
      this.emit('error', { key, error, operation: 'fetch' });
      throw error;
    }
  }

  private handleError({ key, error, operation }: { key: string, error: Error, operation: string }) {
    const metrics = this.getMetrics(key);
    metrics.errors++;
    metrics.lastError = error;
    metrics.lastErrorTime = new Date();
    
    console.error(`Cache ${operation} error for key ${key}:`, error);
    
    const errorRate = metrics.errors / (metrics.fetchTimes.length || 1);
    if (errorRate > 0.1) {
      console.warn(`High error rate (${(errorRate * 100).toFixed(2)}%) for cache key: ${key}`);
    }
  }

  private recordFetchTime({ key, time }: { key: string, time: number }) {
    const metrics = this.getMetrics(key);
    metrics.fetchTimes.push(time);
    
    if (metrics.fetchTimes.length > this.MAX_FETCH_TIMES) {
      metrics.fetchTimes.shift();
    }

    const avgTime = this.calculateAvgFetchTime(metrics.fetchTimes);
    if (time > avgTime * 2) {
      console.warn(`Slow fetch detected for key ${key}: ${time}ms (avg: ${avgTime.toFixed(2)}ms)`);
    }
  }

  private getMetrics(key: string): CacheMetrics {
    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        fetchTimes: [],
        errors: 0
      });
    }
    return this.metrics.get(key)!;
  }

  private calculateAvgFetchTime(times: number[]): number {
    if (times.length === 0) return 0;
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: { ttl?: number; retryOptions?: RetryOptions } = {}
  ): Promise<T> {
    if (this.warmupPromise) {
      await this.warmupPromise;
      this.warmupPromise = null;
    }

    const cachedValue = this.cache.get(key);
    if (cachedValue !== undefined) {
      this.hitCounter++;
      return cachedValue as T;
    }

    // 尝试从持久化存储加载
    if (this.persistenceManager) {
      try {
        const persistedValue = await this.persistenceManager.load(key);
        if (persistedValue !== null) {
          this.cache.set(key, persistedValue, { ttl: options.ttl });
          this.hitCounter++;
          return persistedValue as T;
        }
      } catch (error) {
        console.warn(`Failed to load persisted value for key ${key}:`, error);
      }
    }

    this.missCounter++;
    return this.concurrencyController.add(async () => {
      try {
        const value = await this.retryOperation(
          async () => {
            const fetchedValue = await this.timedFetch(key, fetcher);
            await this.set(key, fetchedValue, { ttl: options.ttl });
            return fetchedValue;
          },
          options.retryOptions
        );
        return value as T;
      } catch (error) {
        this.emit('error', { key, error, operation: 'get' });
        throw error;
      }
    });
  }

  async set(key: string, value: any, options: { ttl?: number } = {}) {
    this.cache.set(key, value, { ttl: options.ttl });

    if (this.persistenceManager) {
      try {
        await this.persistenceManager.save(key, value);
      } catch (error) {
        console.error(`Failed to persist value for key ${key}:`, error);
        this.emit('error', { key, error, operation: 'persist' });
      }
    }
  }

  async getStats(): Promise<CacheStats> {
    const allFetchTimes = Array.from(this.metrics.values())
      .flatMap(m => m.fetchTimes);
    
    const totalRequests = this.hitCounter + this.missCounter;
    const hitRate = totalRequests > 0 ? this.hitCounter / totalRequests : 0;
    const missRate = totalRequests > 0 ? this.missCounter / totalRequests : 0;
    
    const stats: CacheStats = {
      size: this.cache.size,
      maxSize: this.cache.max,
      hits: this.hitCounter,
      misses: this.missCounter,
      errors: Array.from(this.metrics.values())
        .reduce((sum, m) => sum + m.errors, 0),
      avgFetchTime: this.calculateAvgFetchTime(allFetchTimes),
      hitRate,
      missRate,
      memoryUsage: process.memoryUsage().heapUsed,
      warmupStats: {
        totalTime: this.warmupStats.endTime - this.warmupStats.startTime,
        successCount: this.warmupStats.successCount,
        failureCount: this.warmupStats.failureCount,
        averageWarmupTime: this.warmupStats.warmupTimes.length > 0
          ? this.warmupStats.warmupTimes.reduce((a, b) => a + b, 0) / this.warmupStats.warmupTimes.length
          : 0
      },
      concurrency: this.concurrencyController.getStats()
    };

    if (this.persistenceManager) {
      stats.persistence = await this.persistenceManager.getStats();
    }

    return stats;
  }

  getKeyMetrics(key: string) {
    const metrics = this.getMetrics(key);
    return {
      avgFetchTime: this.calculateAvgFetchTime(metrics.fetchTimes),
      errors: metrics.errors,
      lastError: metrics.lastError,
      lastErrorTime: metrics.lastErrorTime,
    };
  }

  async clear() {
    this.cache.clear();
    this.hitCounter = 0;
    this.missCounter = 0;
    this.metrics.clear();
    
    Array.from(this.refreshIntervals.values()).forEach(timer => {
      clearInterval(timer);
    });
    this.refreshIntervals.clear();

    if (this.persistenceManager) {
      await this.persistenceManager.clear();
    }
  }

  async delete(key: string) {
    this.cache.delete(key);
    this.metrics.delete(key);
    
    if (this.refreshIntervals.has(key)) {
      clearInterval(this.refreshIntervals.get(key));
      this.refreshIntervals.delete(key);
    }

    if (this.persistenceManager) {
      await this.persistenceManager.delete(key);
    }
  }

  async prewarm(configs: CacheOptions['warmup']) {
    if (!configs) return;
    await this.warmupCache(configs);
  }

  private async triggerMemoryOptimization() {
    // 获取最少使用的项目
    const leastUsedItems = Array.from(this.cache.entries())
      .sort((a, b) => a[1].hits - b[1].hits)
      .slice(0, Math.floor(this.cache.size * 0.2)); // 清理20%的项目

    for (const [key] of leastUsedItems) {
      this.cache.delete(key);
    }

    // 触发垃圾回收
    if (global.gc) {
      global.gc();
    }
  }

  dispose() {
    clearInterval(this.memoryWatcher);
    this.cache.clear();
    // 清理其他资源...
  }
}

// 创建缓存实例
export const resourceCache = new QueryCache({ 
  max: 500,
  maxConcurrent: 5,
  persistence: {
    directory: '.cache/resources',
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 1000
  },
  warmup: [
    {
      key: 'recent-resources',
      fetcher: async () => {
        const { prisma, initializePrisma } = await import('@/lib/prisma-client');
        await initializePrisma();
        return prisma.resource.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            description: true,
            url: true,
            createdAt: true,
          }
        });
      },
      ttl: 1000 * 60 * 5, // 5 分钟
      retryOptions: {
        maxRetries: 3,
        retryDelay: 1000
      },
      refreshInterval: 1000 * 60 * 5, // 5 分钟刷新一次
      priority: 1
    }
  ]
});

export const metadataCache = new QueryCache({ 
  max: 100,
  maxConcurrent: 3,
  persistence: {
    directory: '.cache/metadata',
    maxFileSize: 1 * 1024 * 1024, // 1MB
    maxFiles: 100
  },
  warmup: [
    {
      key: 'categories',
      fetcher: async () => {
        const { prisma, initializePrisma } = await import('@/lib/prisma-client');
        await initializePrisma();
        return prisma.category.findMany({
          select: {
            id: true,
            name: true,
            _count: {
              select: { resources: true }
            }
          },
          orderBy: { name: 'asc' }
        });
      },
      ttl: 1000 * 60 * 30, // 30 分钟
      retryOptions: {
        maxRetries: 3,
        retryDelay: 1000
      },
      refreshInterval: 1000 * 60 * 15, // 15 分钟刷新一次
      priority: 2
    },
    {
      key: 'tags',
      fetcher: async () => {
        const { prisma, initializePrisma } = await import('@/lib/prisma-client');
        await initializePrisma();
        return prisma.tag.findMany({
          select: {
            id: true,
            name: true,
            _count: {
              select: { resources: true }
            }
          },
          orderBy: { name: 'asc' }
        });
      },
      ttl: 1000 * 60 * 30, // 30 分钟
      retryOptions: {
        maxRetries: 3,
        retryDelay: 1000
      },
      refreshInterval: 1000 * 60 * 15, // 15 分钟刷新一次
      priority: 3
    }
  ]
});
