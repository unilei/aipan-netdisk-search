import prisma from "~/lib/prisma";
import {
  createPointTaskClaimChallenge,
  POINT_TASK_READ_DELAY_MS,
} from "~/server/services/points/pointTaskChallenge.mjs";
import { resolvePointTaskClaimDecision } from "~/server/services/points/pointTasks.mjs";

export default defineEventHandler(async (event) => {
  const userId = Number(event.context.user?.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
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

  const task = await prisma.pointTask.findUnique({
    where: { key },
  });
  if (!task) {
    throw createError({
      statusCode: 404,
      statusMessage: "积分任务不存在",
    });
  }

  const completedCount = await prisma.pointTaskCompletion.count({
    where: {
      userId,
      taskId: task.id,
    },
  });
  const decision = resolvePointTaskClaimDecision({
    task,
    completedCount,
  });

  if (!decision.claimable) {
    return {
      code: 409,
      msg: decision.message,
      data: {
        started: false,
        reason: decision.reason,
      },
    };
  }

  const config = useRuntimeConfig();
  const challenge = createPointTaskClaimChallenge({
    secret: config.jwtSecret,
    userId,
    taskId: task.id,
    taskKey: task.key,
    taskVersion: task.updatedAt.getTime(),
    claimNo: decision.claimNo,
  });

  return {
    code: 200,
    msg: "任务计时已开始",
    data: {
      started: true,
      claimToken: challenge.token,
      readyAt: challenge.readyAt,
      expiresAt: challenge.expiresAt,
      readDelaySeconds: Math.ceil(POINT_TASK_READ_DELAY_MS / 1000),
      task: {
        key: task.key,
        url: task.url,
      },
    },
  };
});
