import prisma from "~/lib/prisma";
import { markForumTopicRead } from "~/server/services/forum/readStates.mjs";
import { requireForumUser } from "~/server/utils/forumAuth";

export default defineEventHandler(async (event) => {
  try {
    const user = requireForumUser(event);
    const { slug } = getRouterParams(event);

    if (!slug) {
      return {
        success: false,
        message: "主题不存在",
      };
    }

    const topic = await prisma.forumTopic.findUnique({
      where: { slug: decodeURI(slug) },
      select: { id: true },
    });

    if (!topic) {
      return {
        success: false,
        message: "主题不存在",
      };
    }

    await markForumTopicRead({
      userId: user.userId,
      topicId: topic.id,
      prismaClient: prisma,
    });

    return {
      success: true,
      message: "已标记为已读",
    };
  } catch (error: any) {
    console.error("标记论坛主题已读失败:", error);
    if (error.statusCode) {
      throw error;
    }

    return {
      success: false,
      message: "标记已读失败",
    };
  }
});
