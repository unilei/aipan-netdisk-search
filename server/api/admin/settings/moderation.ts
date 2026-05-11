import {
  DEFAULT_MODERATION_LIBRARY_SUMMARY,
  getModerationConfig,
  saveModerationConfig,
} from "~/server/utils/moderation";

const buildModerationResponse = (config: Awaited<ReturnType<typeof getModerationConfig>>) => ({
  ...config,
  defaultLibrarySummary: DEFAULT_MODERATION_LIBRARY_SUMMARY,
});

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
      const config = await getModerationConfig();

      return {
        code: 200,
        data: buildModerationResponse(config),
      };
    } catch (error) {
      console.error("获取内容审核配置失败:", error);
      return {
        code: 500,
        msg: "获取配置失败",
      };
    }
  }

  if (event.method === "POST") {
    try {
      const body = await readBody(event);
      const config = await saveModerationConfig(body);

      return {
        code: 200,
        msg: "内容审核配置保存成功",
        data: buildModerationResponse(config),
      };
    } catch (error) {
      console.error("保存内容审核配置失败:", error);
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
