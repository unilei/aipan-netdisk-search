import { redeemCodeForUser } from "~/server/services/points/redemptionCodes.mjs";
import { createRateLimiter } from "~/server/utils/rateLimit";

const redemptionLimiter = createRateLimiter({
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
  if (
    redemptionLimiter.isLimited(`user:${userId}`) ||
    redemptionLimiter.isLimited(`ip:${clientIp}`)
  ) {
    throw createError({
      statusCode: 429,
      statusMessage: "请求过于频繁，请稍后再试",
    });
  }

  const body = await readBody(event);
  const result = await redeemCodeForUser({
    userId,
    code: body?.code,
    ip: clientIp,
    userAgent: getRequestHeader(event, "user-agent"),
  });

  return {
    code: 200,
    msg: "兑换成功",
    data: {
      granted: result.granted,
      points: result.points,
      isTemporary: result.isTemporary,
      expiresAt: result.expiresAt,
      totalPoints: result.totalPoints,
      permanentPoints: result.permanentPoints,
      temporaryPoints: result.temporaryPoints,
      effectivePoints: result.effectivePoints,
      nextExpiringAt: result.nextExpiringAt,
      pointsBreakdown: result.pointsBreakdown,
    },
  };
});
