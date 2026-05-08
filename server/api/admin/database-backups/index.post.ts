import { requireAdmin } from "~/server/utils/auth";
import { createManualDatabaseBackup } from "~/server/services/databaseBackups/r2CliBackups.mjs";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  try {
    const backup = await createManualDatabaseBackup();

    return {
      code: 200,
      msg: "数据库备份已完成",
      data: {
        backup,
      },
    };
  } catch (error: any) {
    console.error("手动数据库备份失败:", error);

    return {
      code: error.statusCode || 500,
      msg: error.message || "手动数据库备份失败",
    };
  }
});
