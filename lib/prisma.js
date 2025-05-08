/**
 * Prisma 客户端配置文件
 * 使用 PostgreSQL 驱动适配器连接数据库
 */

import { PrismaClient } from "~/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { fileURLToPath } from "url";
import { dirname } from "path";

// ES Module 环境中的 __dirname 和 __filename 替代品
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 创建日志函数
const logInfo = (message) => console.log(`[Prisma Info] ${message}`);
const logError = (message, error) =>
  console.error(`[Prisma Error] ${message}`, error);

// 初始化 Prisma 客户端
let prisma;

try {
  // 从环境变量中获取数据库连接字符串
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL 环境变量未设置");
  }

  // 创建 PostgreSQL 适配器
  const adapter = new PrismaPg({ connectionString });

  // 创建 Prisma 客户端实例
  prisma = new PrismaClient({
    adapter,
    log: [
      { level: "query", emit: "event" },
      { level: "info", emit: "stdout" },
      { level: "warn", emit: "stdout" },
      { level: "error", emit: "stdout" },
    ],
    errorFormat: "pretty",
  });

  // 注册查询日志事件
  prisma.$on("query", (e) => {
    if (process.env.NODE_ENV !== "production") {
      logInfo(`查询: ${e.query}`);
      logInfo(`参数: ${e.params}`);
      logInfo(`持续时间: ${e.duration}ms`);
    }
  });

  // 打印数据库连接信息（隐藏敏感信息）
  logInfo(`数据库连接初始化: ${connectionString.replace(/:[^:]*@/, ":****@")}`);
} catch (error) {
  logError("初始化 Prisma 客户端失败", error);
  throw error;
}

// 扩展 Prisma 客户端，添加日期字段处理和全局错误处理
const extendedPrisma = prisma.$extends({
  // 全局错误处理
  query: {
    async $allOperations({ operation, model, args, query }) {
      try {
        return await query(args);
      } catch (error) {
        logError(`${model}.${operation} 操作失败`, error);
        throw error;
      }
    },
  },
});

// 确保程序退出时断开连接
process.on("SIGINT", async () => {
  logInfo("应用关闭，正在断开数据库连接...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logInfo("应用终止，正在断开数据库连接...");
  await prisma.$disconnect();
  process.exit(0);
});

// 导出扩展后的 Prisma 客户端
export default extendedPrisma;
