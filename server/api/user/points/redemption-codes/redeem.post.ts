import { redeemCodeForUser } from "~/server/services/points/redemptionCodes.mjs";
import prisma from "~/lib/prisma";
import { getUserPointsBreakdown } from "~/server/services/points/userPoints";
import { createRateLimiter } from "~/server/utils/rateLimit";

const redeemCode = redeemCodeForUser as (input: {
  userId: number;
  code: unknown;
  ip: string;
  userAgent?: string;
  client: typeof prisma;
  getUserPointsBreakdown: typeof getUserPointsBreakdown;
}) => Promise<any>;

const redemptionLimiter = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 10,
});

const getClientIp = (event: any) => {
  const forwardedFor = getRequestHeader(event, "x-forwarded-for");
  return (
    String(forwardedFor || event.node.req.socket?.remoteAddress || "unknown").split(",")[0] ||
    "unknown"
  ).trim();
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
  const result = await redeemCode({
    userId,
    code: body?.code,
    ip: clientIp,
    userAgent: getRequestHeader(event, "user-agent"),
    client: prisma,
    getUserPointsBreakdown,
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
