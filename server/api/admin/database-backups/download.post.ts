import { requireAdmin } from "~/server/utils/auth";
import { createDatabaseBackupDownloadUrl } from "~/server/services/databaseBackups/r2CliBackups.mjs";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  try {
    const body = await readBody(event);
    const download = await createDatabaseBackupDownloadUrl(body?.key);

    return {
      code: 200,
      msg: "success",
      data: download,
    };
  } catch (error: any) {
    console.error("生成数据库备份下载链接失败:", error);

    return {
      code: error.statusCode || 500,
      msg: error.message || "生成数据库备份下载链接失败",
    };
  }
});
