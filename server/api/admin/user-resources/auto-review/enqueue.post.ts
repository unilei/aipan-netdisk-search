import { verifyToken } from "~/server/model/user";
import prisma from "~/lib/prisma";
import {
  enqueueUserResourceAutoReview,
  getUserResourceAutoReviewQueueStats,
} from "~/server/services/userResources/autoReviewQueue.js";

const clampInt = (value: unknown, fallback: number, min: number, max: number) => {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, min), max);
};

export default defineEventHandler(async (event) => {
  const token = getHeader(event, "authorization")?.split(" ")[1];
  const user = token ? verifyToken(token) : null;

  if (!user || user.role !== "admin") {
    throw createError({
      statusCode: 403,
      message: "无权限访问",
    });
  }

  const body = await readBody(event);
  const limit = clampInt(body?.limit, 1000, 1, 5000);
  const pendingResources = await prisma.userResource.findMany({
    where: { status: "pending" },
    select: { id: true },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  let queued = 0;
  let duplicate = 0;
  let failed = 0;
  const failures: Array<{ resourceId: number; error: string }> = [];

  for (const resource of pendingResources) {
    try {
      const result = await enqueueUserResourceAutoReview(resource.id, {
        notifyUser: body?.notifyUser !== false,
        emailEnabled: body?.emailEnabled !== false,
        approveValid: body?.approveValid !== false,
        rejectInvalid: Boolean(body?.rejectInvalid),
        requireReachable: Boolean(body?.requireReachable),
      });

      if (result.queued) {
        queued += 1;
      } else if (result.duplicate) {
        duplicate += 1;
      }
    } catch (error: any) {
      failed += 1;
      failures.push({
        resourceId: resource.id,
        error: error?.message || "入队失败",
      });
    }
  }

  const queue = await getUserResourceAutoReviewQueueStats();

  return {
    code: 200,
    msg: "历史待审核资源已加入自动审核队列",
    data: {
      total: pendingResources.length,
      queued,
      duplicate,
      failed,
      failures,
      queue,
    },
  };
});
