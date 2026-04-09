import {
  getEmailServiceConfigForAdmin,
  saveEmailServiceConfig,
} from "~/server/services/email/resend";

export default defineEventHandler(async (event) => {
  const user = event.context.user;

  if (!user || user.role !== "admin") {
    return {
      code: 403,
      msg: "无权限访问",
    };
  }

  if (event.method === "GET") {
    try {
      const config = await getEmailServiceConfigForAdmin();

      return {
        code: 200,
        msg: "success",
        data: config,
      };
    } catch (error) {
      console.error("获取邮箱配置失败:", error);

      return {
        code: 500,
        msg: "获取邮箱配置失败",
      };
    }
  }

  if (event.method === "POST") {
    try {
      const body = await readBody(event);

      await saveEmailServiceConfig(body);

      return {
        code: 200,
        msg: "邮箱配置保存成功",
      };
    } catch (error: any) {
      console.error("保存邮箱配置失败:", error);

      return {
        code: error.statusCode || 500,
        msg: error.statusMessage || error.message || "保存邮箱配置失败",
      };
    }
  }

  return {
    code: 405,
    msg: "方法不允许",
  };
});
