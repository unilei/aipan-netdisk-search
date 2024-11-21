import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;
const connectionSchema = `${process.env.DATABASE_SCHEMA}`;

const pool = new pg.Pool({
  connectionString,
  max: 10, // 降低最大连接数，避免连接过多
  min: 2,  // 降低最小连接数
  idleTimeoutMillis: 60000, // 增加空闲超时时间到 1 分钟
  connectionTimeoutMillis: 5000, // 增加连接超时时间到 5 秒
  maxUses: 5000, // 降低每个连接的最大使用次数
  keepAlive: true, // 启用 keepAlive
  keepAliveInitialDelayMillis: 10000, // keepAlive 初始延迟
  application_name: 'aipan-netdisk-search', // 添加应用名称，便于调试
});

// 监听连接错误
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  // 尝试结束有问题的客户端连接
  if (client) {
    client.release(true);
  }
});

// 添加连接池错误处理
pool.on('connect', (client) => {
  console.log('New client connected');
});

pool.on('remove', (client) => {
  console.log('Client removed from pool');
});

// 定期清理空闲连接
setInterval(() => {
  pool.query('SELECT 1');
}, 50000);

const adapter = new PrismaPg(pool, {
  schema: connectionSchema,
  max_parallelism: 5, // 限制并行查询数
});

// 创建 Prisma 客户端实例
const prisma = new PrismaClient({
  adapter,
  log: ['query', 'info', 'warn', 'error'],
  // 使用新的方式定义中间件
  errorFormat: 'pretty',
});

// 扩展 Prisma 客户端，添加全局错误处理
const extendedPrisma = prisma.$extends({
  query: {
    async $allOperations({ operation, model, args, query }) {
      try {
        const result = await query(args);
        return result;
      } catch (error) {
        console.error(`Prisma Error in ${model}.${operation}:`, error);
        throw error;
      }
    },
  },
});

// 确保程序退出时关闭连接池
process.on('SIGINT', async () => {
  await pool.end();
  process.exit();
});

process.on('SIGTERM', async () => {
  await pool.end();
  process.exit();
});

export default extendedPrisma;
