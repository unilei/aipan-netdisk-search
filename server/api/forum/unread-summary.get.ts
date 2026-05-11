import prisma from "~/lib/prisma";
import { getForumUnreadSummary } from "~/server/services/forum/readStates.mjs";
import { requireForumUser } from "~/server/utils/forumAuth";

export default defineEventHandler(async (event) => {
  try {
    const user = requireForumUser(event);
    const query = getQuery(event);
    const limit = query.limit ? parseInt(String(query.limit), 10) : 5;
    const summary = await getForumUnreadSummary({
      userId: user.userId,
      limit,
      prismaClient: prisma,
    });

    return {
      success: true,
      data: summary,
    };
  } catch (error: any) {
    console.error("获取论坛未读摘要失败:", error);
    if (error.statusCode) {
      throw error;
    }

    return {
      success: false,
      message: "获取论坛未读摘要失败",
    };
  }
});
