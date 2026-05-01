import {
  getFeatureAccessConfig,
  saveFeatureAccessConfig,
} from "~/server/utils/featureAccess";

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
      const config = await getFeatureAccessConfig();

      return {
        code: 200,
        data: config,
      };
    } catch (error) {
      console.error("获取访问限制配置失败:", error);
      return {
        code: 500,
        msg: "获取配置失败",
      };
    }
  }

  if (event.method === "POST") {
    try {
      const body = await readBody(event);
      const config = await saveFeatureAccessConfig(body);

      return {
        code: 200,
        msg: "访问限制配置保存成功",
        data: config,
      };
    } catch (error) {
      console.error("保存访问限制配置失败:", error);
      return {
        code: 500,
        msg: "保存配置失败",
      };
    }
  }

  return {
    code: 405,
    msg: "方法不允许",
  };
});
