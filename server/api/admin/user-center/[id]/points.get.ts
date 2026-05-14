import prisma from "~/lib/prisma";
import {
  decoratePointsHistory,
  getUserPointsBreakdown,
} from "~/server/services/points/userPoints";

const POINT_TYPE_NAMES: Record<string, string> = {
  checkin: "每日签到",
  bonus: "连续签到奖励",
  consume: "积分消费",
  admin: "管理员调整",
  activity: "活动奖励",
  task: "任务奖励",
  transfer: "转存奖励",
  registration_gift: "注册礼包",
  redemption: "兑换码奖励",
  daily_redemption_drop: "每日福利",
};

export default defineEventHandler(async (event) => {
  const { user } = event.context;
  if (!user || user.role !== "admin") {
    throw createError({
      statusCode: 403,
      message: "没有权限访问此资源",
    });
  }

  const userId = Number(event.context.params?.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    throw createError({
      statusCode: 400,
      message: "无效的用户ID",
    });
  }

  const query = getQuery(event);
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        points: true,
        createdAt: true,
      },
    });

    if (!targetUser) {
      throw createError({
        statusCode: 404,
        message: "用户不存在",
      });
    }

    const [pointsBreakdown, pointsHistory, total, totalEarned, totalSpent] =
      await Promise.all([
        getUserPointsBreakdown(userId, {
          permanentPoints: targetUser.points,
        }),
        prisma.pointsHistory.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.pointsHistory.count({
          where: { userId },
        }),
        prisma.pointsHistory.aggregate({
          where: {
            userId,
            points: { gt: 0 },
          },
          _sum: {
            points: true,
          },
        }),
        prisma.pointsHistory.aggregate({
          where: {
            userId,
            points: { lt: 0 },
          },
          _sum: {
            points: true,
          },
        }),
      ]);

    const decoratedHistory = decoratePointsHistory(pointsHistory).map(
      (record: any) => ({
        ...record,
        typeName: POINT_TYPE_NAMES[record.type] || record.type,
      }),
    );

    return {
      code: 200,
      msg: "success",
      data: {
        user: {
          id: targetUser.id,
          username: targetUser.username,
          email: targetUser.email,
          role: targetUser.role,
          status: targetUser.status,
          createdAt: targetUser.createdAt,
        },
        currentPoints: pointsBreakdown.effectivePoints,
        permanentPoints: pointsBreakdown.permanentPoints,
        temporaryPoints: pointsBreakdown.temporaryPoints,
        effectivePoints: pointsBreakdown.effectivePoints,
        nextExpiringAt: pointsBreakdown.nextExpiringAt,
        breakdown: pointsBreakdown,
        stats: {
          totalEarned: totalEarned._sum.points || 0,
          totalSpent: Math.abs(totalSpent._sum.points || 0),
          recordCount: total,
        },
        history: decoratedHistory,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }

    console.error("获取用户积分详情失败", error);
    throw createError({
      statusCode: 500,
      message: "服务器错误",
    });
  }
});
