import {
  mergeTransferRewardConfigUpdate,
  pickTransferRewardConfig,
} from "~/server/services/quark/quarkConfig.mjs";
import {
  getStoredQuarkConfig,
  saveQuarkConfig,
} from "~/server/services/quark/quarkSettingsStore";

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user || user.role !== "admin") {
    throw createError({
      statusCode: 403,
      statusMessage: "无权限访问",
    });
  }

  if (event.method === "GET") {
    const config = await getStoredQuarkConfig();

    return {
      code: 200,
      msg: "获取成功",
      data: pickTransferRewardConfig(config),
    };
  }

  if (event.method === "POST") {
    const body = await readBody(event);
    const storedConfig = await getStoredQuarkConfig();
    const updatedConfig = mergeTransferRewardConfigUpdate(storedConfig, body);

    await saveQuarkConfig(updatedConfig);

    return {
      code: 200,
      msg: "转存积分任务已保存",
      data: pickTransferRewardConfig(updatedConfig),
    };
  }

  throw createError({
    statusCode: 405,
    statusMessage: "请求方法不支持",
  });
});
