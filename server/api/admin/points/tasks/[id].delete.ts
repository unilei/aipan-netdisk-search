import prisma from "~/lib/prisma";

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
    include: {
      _count: {
        select: {
          completions: true,
        },
      },
    },
  });

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: "积分任务不存在",
    });
  }

  if ((existing._count?.completions || 0) > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: "该任务已有领取记录，请改为禁用，避免破坏积分审计记录",
    });
  }

  await prisma.pointTask.delete({
    where: { id },
  });

  return {
    code: 200,
    msg: "积分任务已删除",
  };
});
