import { getDailyRedemptionDropStatusForUser } from "~/server/services/points/dailyRedemptionDrops.mjs";

export default defineEventHandler(async (event) => {
  const userId = event.context.user?.userId;
  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: "请先登录",
    });
  }

  const status = await getDailyRedemptionDropStatusForUser({
    userId,
  });

  return {
    code: 200,
    msg: "获取成功",
    data: status,
  };
});
