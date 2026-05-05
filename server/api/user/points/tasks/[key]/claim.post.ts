import prisma from "~/lib/prisma";
import { getUserPointsBreakdown, POINT_TYPES } from "~/server/services/points/userPoints";
import { resolvePointTaskClaimDecision } from "~/server/services/points/pointTasks.mjs";

export default defineEventHandler(async (event) => {
  const userId = event.context.user?.userId;
  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: "请先登录",
    });
  }

  const key = decodeURIComponent(getRouterParam(event, "key") || "");
  if (!key) {
    throw createError({
      statusCode: 400,
      statusMessage: "任务标识不能为空",
    });
  }

  try {
    const result = await prisma.$transaction(async (tx: any) => {
      const task = await tx.pointTask.findUnique({
        where: { key },
      });

      if (!task) {
        throw createError({
          statusCode: 404,
          statusMessage: "积分任务不存在",
        });
      }

      const completedCount = await tx.pointTaskCompletion.count({
        where: {
          userId,
          taskId: task.id,
        },
      });
      const decision = resolvePointTaskClaimDecision({ task, completedCount });

      if (!decision.claimable) {
        const breakdown = await getUserPointsBreakdown(userId, {
          client: tx,
        });

        return {
          granted: false,
          reason: decision.reason,
          message: decision.message,
          points: 0,
          task,
          completedCount,
          pointsBreakdown: breakdown,
        };
      }

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          points: {
            increment: task.points,
          },
        },
        select: {
          points: true,
        },
      });

      const pointsRecord = await tx.pointsHistory.create({
        data: {
          userId,
          points: task.points,
          type: POINT_TYPES.task,
          description: `完成任务：${task.title}`,
          relatedId: task.id,
        },
      });

      const completion = await tx.pointTaskCompletion.create({
        data: {
          userId,
          taskId: task.id,
          claimNo: decision.claimNo,
          points: task.points,
          pointsHistoryId: pointsRecord.id,
        },
      });

      const breakdown = await getUserPointsBreakdown(userId, {
        client: tx,
        permanentPoints: updatedUser.points,
      });

      return {
        granted: true,
        reason: "granted",
        message: "任务奖励领取成功",
        points: task.points,
        task,
        completion,
        completedCount: completedCount + 1,
        pointsBreakdown: breakdown,
      };
    });

    return {
      code: 200,
      msg: result.message,
      data: {
        granted: result.granted,
        reason: result.reason,
        points: result.points,
        task: {
          id: result.task.id,
          key: result.task.key,
          title: result.task.title,
          claimLimit: result.task.claimLimit,
          completedCount: result.completedCount,
        },
        totalPoints: result.pointsBreakdown.effectivePoints,
        permanentPoints: result.pointsBreakdown.permanentPoints,
        temporaryPoints: result.pointsBreakdown.temporaryPoints,
        effectivePoints: result.pointsBreakdown.effectivePoints,
        nextExpiringAt: result.pointsBreakdown.nextExpiringAt,
        pointsBreakdown: result.pointsBreakdown,
      },
    };
  } catch (error: any) {
    if (error.code === "P2002") {
      throw createError({
        statusCode: 409,
        statusMessage: "该任务奖励已领取",
      });
    }

    if (error.statusCode) {
      throw error;
    }

    console.error("领取积分任务奖励失败:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "领取积分任务奖励失败",
    });
  }
});
