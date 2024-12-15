import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPool } from './prisma-pool';
import { EventEmitter } from 'events';

// 定义查询性能阈值（毫秒）
const SLOW_QUERY_THRESHOLD = 100;
const VERY_SLOW_QUERY_THRESHOLD = 1000;

// 定义查询超时时间（毫秒）
const QUERY_TIMEOUT = 30000;

// 连接池配置
const POOL_CONFIG = {
  min: 2,
  max: 10,
  idleTimeout: 30000,
  acquireTimeout: 5000
};

// 查询统计
interface QueryStats {
  totalQueries: number;
  slowQueries: number;
  verySlowQueries: number;
  errors: number;
  averageQueryTime: number;
  queryTimes: number[];
}

// 参数验证接口
interface QueryValidation {
  maxLimit?: number;
  requiredFields?: string[];
  maxDepth?: number;
}

// 验证查询参数
function validateQueryParams(args: Record<string, any> | undefined, validation: QueryValidation = {}): void {
  if (!args) return;

  // 验证分页限制
  if (validation.maxLimit && args.take && args.take > validation.maxLimit) {
    throw new Error(`Pagination limit exceeds maximum allowed value of ${validation.maxLimit}`);
  }

  // 验证必填字段
  if (validation.requiredFields) {
    for (const field of validation.requiredFields) {
      if (!(field in args)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
  }

  // 验证查询深度
  if (validation.maxDepth) {
    const depth = calculateQueryDepth(args);
    if (depth > validation.maxDepth) {
      throw new Error(`Query depth ${depth} exceeds maximum allowed depth of ${validation.maxDepth}`);
    }
  }
}

// 计算查询深度
function calculateQueryDepth(obj: any, depth = 0): number {
  if (!obj || typeof obj !== 'object') return depth;
  
  const nestedDepth = Object.values(obj)
    .map(value => calculateQueryDepth(value, depth + 1))
    .reduce((max, current) => Math.max(max, current), depth);
    
  return nestedDepth;
}

class PrismaManager extends EventEmitter {
  private pool: PrismaPool;
  private stats: QueryStats = {
    totalQueries: 0,
    slowQueries: 0,
    verySlowQueries: 0,
    errors: 0,
    averageQueryTime: 0,
    queryTimes: []
  };
  
  private static instance: PrismaManager;

  private constructor() {
    super();
    this.pool = new PrismaPool(POOL_CONFIG);
    this.setupPoolEvents();
  }

  static getInstance(): PrismaManager {
    if (!PrismaManager.instance) {
      PrismaManager.instance = new PrismaManager();
    }
    return PrismaManager.instance;
  }

  private setupPoolEvents() {
    this.pool.on('query', (e) => {
      this.emit('query', e);
    });

    this.pool.on('error', (e) => {
      this.stats.errors++;
      this.emit('error', e);
    });
  }

  private updateQueryStats(duration: number) {
    this.stats.totalQueries++;
    this.stats.queryTimes.push(duration);
    
    if (this.stats.queryTimes.length > 100) {
      this.stats.queryTimes.shift();
    }
    
    this.stats.averageQueryTime = 
      this.stats.queryTimes.reduce((a, b) => a + b, 0) / this.stats.queryTimes.length;

    if (duration > VERY_SLOW_QUERY_THRESHOLD) {
      this.stats.verySlowQueries++;
    } else if (duration > SLOW_QUERY_THRESHOLD) {
      this.stats.slowQueries++;
    }
  }

  async getClient() {
    const client = await this.pool.acquire();
    const manager = this;

    return client.$extends({
      query: {
        async $allOperations({ operation, model, args, query }) {
          const startTime = performance.now();
          
          try {
            // 验证查询参数
            validateQueryParams(args, {
              maxLimit: 100,
              maxDepth: 5
            });

            // 添加查询超时
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error(`Query timeout after ${QUERY_TIMEOUT}ms`)), QUERY_TIMEOUT);
            });

            const queryPromise = query(args);
            const result = await Promise.race([queryPromise, timeoutPromise]);
            
            const duration = performance.now() - startTime;
            manager.updateQueryStats(duration);
            
            if (duration > VERY_SLOW_QUERY_THRESHOLD) {
              console.error(
                '\x1b[31m%s\x1b[0m',
                ` VERY SLOW QUERY DETECTED (${Math.round(duration)}ms):\n` +
                `Model: ${model}\n` +
                `Operation: ${operation}\n` +
                `Args: ${formatQueryArgs(args)}\n`
              );
              manager.emit('very-slow-query', { model, operation, duration, args });
            } else if (duration > SLOW_QUERY_THRESHOLD) {
              console.warn(
                '\x1b[33m%s\x1b[0m',
                ` SLOW QUERY DETECTED (${Math.round(duration)}ms):\n` +
                `Model: ${model}\n` +
                `Operation: ${operation}\n`
              );
              manager.emit('slow-query', { model, operation, duration });
            }
            
            return result;
          } catch (error) {
            manager.stats.errors++;
            console.error(
              '\x1b[31m%s\x1b[0m',
              ` QUERY ERROR:\n` +
              `Model: ${model}\n` +
              `Operation: ${operation}\n` +
              `Error: ${error instanceof Error ? error.message : 'Unknown error'}\n` +
              `Stack: ${error instanceof Error ? error.stack : 'No stack trace'}`
            );
            manager.emit('query-error', { model, operation, error, timestamp: new Date() });
            throw error;
          }
        },
      },
    });
  }

  async releaseClient(client: PrismaClient) {
    await this.pool.release(client);
  }

  async getStats() {
    const poolStats = await this.pool.getStats();
    return {
      pool: poolStats,
      queries: { ...this.stats }
    };
  }

  async shutdown() {
    await this.pool.close();
  }
}

// 单个 Prisma 客户端实例
let _prismaClient: PrismaClient | null = null;

// 初始化 Prisma 客户端
export async function initializePrisma() {
  if (_prismaClient) {
    return _prismaClient;
  }

  const maxRetries = 3;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const client = new PrismaClient({
        log: [
          { level: 'error', emit: 'event' },
          { level: 'warn', emit: 'event' },
        ],
      });

      // Test the connection
      await client.$connect();
      
      // Setup event handlers
      client.$on('error', (e) => {
        console.error('Prisma Client error:', e instanceof Error ? e.message : String(e));
      });

      _prismaClient = client;
      return client;
    } catch (error) {
      lastError = error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Prisma initialization attempt ${attempt} failed: ${errorMessage}`);
      
      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  // If we get here, all retries failed
  const finalErrorMessage = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`Database connection failed after ${maxRetries} attempts: ${finalErrorMessage}`);
}

// 获取 Prisma 客户端
export async function getPrismaClient() {
  if (!_prismaClient) {
    return initializePrisma();
  }
  return _prismaClient;
}

// 关闭 Prisma 客户端连接
export async function disconnectPrisma() {
  if (_prismaClient) {
    try {
      await _prismaClient.$disconnect();
      _prismaClient = null;
    } catch (error) {
      console.error('Error disconnecting Prisma client:', error);
    }
  }
}

// 导出 prisma 实例
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!_prismaClient) {
      throw new Error('Prisma client not initialized. Call initializePrisma() first.');
    }
    return Reflect.get(_prismaClient, prop);
  }
}) as PrismaClient;

// 确保进程退出时断开连接
process.on('beforeExit', async () => {
  await disconnectPrisma();
});

// 格式化查询参数
const formatQueryArgs = (args: Record<string, any> | undefined) => {
  if (!args) return 'No args';
  try {
    return JSON.stringify(args, null, 2);
  } catch (error) {
    return '[Error formatting args]';
  }
};

export default prisma;
