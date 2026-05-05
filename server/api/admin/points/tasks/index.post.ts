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

  try {
    const body = await readBody(event);
    const data = normalizePointTaskInput(body);

    const task = await prisma.pointTask.create({
      data,
    });

    return {
      code: 200,
      msg: "积分任务已创建",
      data: task,
    };
  } catch (error: any) {
    if (error.code === "P2002") {
      throw createError({
        statusCode: 409,
        statusMessage: "任务标识已存在，请换一个标题或标识",
      });
    }

    throw createError({
      statusCode: error.statusCode || 400,
      statusMessage: error.message || "创建积分任务失败",
    });
  }
});
