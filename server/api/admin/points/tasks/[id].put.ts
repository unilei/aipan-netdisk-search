import prisma from "~/lib/prisma";
import { normalizePointTaskInput } from "~/server/services/points/pointTasks.mjs";

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user || user.role !== "admin") {
    throw createError({
      statusCode: 403,
      statusMessage: "无权限访问",
    });
  }

  const id = Number.parseInt(getRouterParam(event, "id") || "", 10);
  if (!Number.isFinite(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: "任务 ID 不正确",
    });
  }

  const existing = await prisma.pointTask.findUnique({
    where: { id },
  });
  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: "积分任务不存在",
    });
  }

  try {
    const body = await readBody(event);
    const data = normalizePointTaskInput(body, {
      existingKey: existing.key,
    });

    const task = await prisma.pointTask.update({
      where: { id },
      data,
    });

    return {
      code: 200,
      msg: "积分任务已更新",
      data: task,
    };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 400,
      statusMessage: error.message || "更新积分任务失败",
    });
  }
});
