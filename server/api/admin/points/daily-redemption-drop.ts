import {
  getAdminDailyRedemptionDropOverview,
  saveDailyRedemptionDropConfig,
} from "~/server/services/points/dailyRedemptionDrops.mjs";

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user || user.role !== "admin") {
    throw createError({
      statusCode: 403,
      statusMessage: "无权限访问",
    });
  }

  if (event.method === "GET") {
    const overview = await getAdminDailyRedemptionDropOverview();

    return {
      code: 200,
      msg: "获取成功",
      data: overview,
    };
  }

  if (event.method === "POST") {
    const body = await readBody(event);
    const overview = await saveDailyRedemptionDropConfig({
      input: body,
    });

    return {
      code: 200,
      msg: "每日抢兑已保存",
      data: overview,
    };
  }

  throw createError({
    statusCode: 405,
    statusMessage: "请求方法不支持",
  });
});
