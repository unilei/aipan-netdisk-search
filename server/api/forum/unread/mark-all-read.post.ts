import prisma from "~/lib/prisma";
import {
  getForumUnreadSummary,
  markAllParticipatingForumTopicsRead,
} from "~/server/services/forum/readStates.mjs";
import { requireForumUser } from "~/server/utils/forumAuth";

export default defineEventHandler(async (event) => {
  try {
    const user = requireForumUser(event);
    const result = await markAllParticipatingForumTopicsRead({
      userId: user.userId,
      prismaClient: prisma,
    });
    const summary = await getForumUnreadSummary({
      userId: user.userId,
      prismaClient: prisma,
    });

    return {
      success: true,
      message: "已将参与主题标记为已读",
      data: {
        updatedCount: result.count,
        summary,
      },
    };
  } catch (error: any) {
    console.error("标记论坛未读为已读失败:", error);
    if (error.statusCode) {
      throw error;
    }

    return {
      success: false,
      message: "标记已读失败",
    };
  }
});
