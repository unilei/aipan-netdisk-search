import { claimDailyRedemptionDropForUser } from "~/server/services/points/dailyRedemptionDrops.mjs";
import { createRateLimiter } from "~/server/utils/rateLimit";

const claimLimiter = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 10,
});

const getClientIp = (event: any) => {
  const forwardedFor = getRequestHeader(event, "x-forwarded-for");
  return String(forwardedFor || event.node.req.socket?.remoteAddress || "unknown")
    .split(",")[0]
    .trim();
};

export default defineEventHandler(async (event) => {
  const userId = event.context.user?.userId;
  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: "请先登录",
    });
  }

  const clientIp = getClientIp(event);
  if (claimLimiter.isLimited(`user:${userId}`) || claimLimiter.isLimited(`ip:${clientIp}`)) {
    throw createError({
      statusCode: 429,
      statusMessage: "请求过于频繁，请稍后再试",
    });
  }

  try {
    const result = await claimDailyRedemptionDropForUser({
      userId,
      ip: clientIp,
      userAgent: getRequestHeader(event, "user-agent"),
    });

    return {
      code: 200,
      msg: result.claimed ? "领取成功" : result.message,
      data: result,
    };
  } catch (error: any) {
    if (error?.code === "P2002") {
      throw createError({
        statusCode: 409,
        statusMessage: "今日已领取",
      });
    }

    console.error("每日福利领取失败:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message || "每日福利领取失败",
    });
  }
});
