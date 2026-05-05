import prisma from "~/lib/prisma";
import { toUserPointTask } from "~/server/services/points/pointTasks.mjs";

export default defineEventHandler(async (event) => {
  const userId = event.context.user?.userId;
  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: "请先登录",
    });
  }

  const tasks = await prisma.pointTask.findMany({
    where: {
      enabled: true,
    },
    orderBy: [
      { sortOrder: "asc" },
      { createdAt: "desc" },
    ],
  });

  const taskIds = tasks.map((task: any) => task.id);
  const completionCounts = taskIds.length
    ? await prisma.pointTaskCompletion.groupBy({
        by: ["taskId"],
        where: {
          userId,
          taskId: {
            in: taskIds,
          },
        },
        _count: {
          _all: true,
        },
      })
    : [];
  const completedByTaskId = new Map(
    completionCounts.map((item: any) => [item.taskId, item._count?._all || 0]),
  );

  return {
    code: 200,
    msg: "success",
    data: {
      tasks: tasks.map((task: any) =>
        toUserPointTask({
          task,
          completedCount: completedByTaskId.get(task.id) || 0,
        }),
      ),
    },
  };
});
