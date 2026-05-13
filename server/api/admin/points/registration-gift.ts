import {
  getStoredRegistrationGiftConfig,
  saveStoredRegistrationGiftConfig,
} from "~/server/services/points/registrationGift.mjs";

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user || user.role !== "admin") {
    throw createError({
      statusCode: 403,
      statusMessage: "无权限访问",
    });
  }

  if (event.method === "GET") {
    const config = await getStoredRegistrationGiftConfig();

    return {
      code: 200,
      msg: "获取成功",
      data: config,
    };
  }

  if (event.method === "POST") {
    const body = await readBody(event);
    const config = await saveStoredRegistrationGiftConfig(body);

    return {
      code: 200,
      msg: "注册礼包配置已保存",
      data: config,
    };
  }

  throw createError({
    statusCode: 405,
    statusMessage: "请求方法不支持",
  });
});
