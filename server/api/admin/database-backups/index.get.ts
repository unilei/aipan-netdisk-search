import { requireAdmin } from "~/server/utils/auth";
import {
  getDatabaseBackupAdminConfig,
  listDatabaseBackups,
} from "~/server/services/databaseBackups/r2CliBackups.mjs";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  try {
    const [backups, config] = await Promise.all([
      listDatabaseBackups(),
      Promise.resolve(getDatabaseBackupAdminConfig()),
    ]);

    return {
      code: 200,
      msg: "success",
      data: {
        backups,
        config,
      },
    };
  } catch (error: any) {
    console.error("获取数据库备份列表失败:", error);

    return {
      code: error.statusCode || 500,
      msg: error.message || "获取数据库备份列表失败",
    };
  }
});
