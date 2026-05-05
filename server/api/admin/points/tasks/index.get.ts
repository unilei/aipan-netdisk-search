import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user || user.role !== "admin") {
    throw createError({
      statusCode: 403,
      statusMessage: "无权限访问",
    });
  }

  const tasks = await prisma.pointTask.findMany({
    orderBy: [
      { sortOrder: "asc" },
      { createdAt: "desc" },
    ],
    include: {
      _count: {
        select: {
          completions: true,
        },
      },
    },
  });

  return {
    code: 200,
    msg: "获取成功",
    data: tasks.map((task: any) => ({
      ...task,
      completionCount: task._count?.completions || 0,
      _count: undefined,
    })),
  };
});
