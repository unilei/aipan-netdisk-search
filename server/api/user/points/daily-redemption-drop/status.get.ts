import { getDailyRedemptionDropStatusForUser } from "~/server/services/points/dailyRedemptionDrops.mjs";
import prisma from "~/lib/prisma";

const getDailyDropStatus = getDailyRedemptionDropStatusForUser as (input: {
  userId: number;
  client: typeof prisma;
}) => Promise<any>;

export default defineEventHandler(async (event) => {
  const userId = event.context.user?.userId;
  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: "请先登录",
    });
  }

  const status = await getDailyDropStatus({
    userId,
    client: prisma,
  });

  return {
    code: 200,
    msg: "获取成功",
    data: status,
  };
});
