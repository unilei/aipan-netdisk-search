import prisma from "~/lib/prisma";
import { getUserPointsBreakdown } from "~/server/services/points/userPoints";
import { getStoredPrivateMessageConfig } from "~/server/services/points/privateMessageEligibility.mjs";
import { startPrivateConversation } from "~/server/services/chat/privateConversations.mjs";

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user || !user.userId) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      message: "请先登录",
    });
  }

  const body = await readBody(event);
  const recipientId = Number(body?.recipientId);
  const content = typeof body?.content === "string" ? body.content : "";
  const sourceForumTopicId = body?.sourceForumTopicId
    ? Number(body.sourceForumTopicId)
    : null;

  try {
    const config = await getStoredPrivateMessageConfig(prisma);
    const result = await startPrivateConversation({
      actor: {
        id: user.userId,
        username: user.username,
        role: user.role,
      },
      recipientId,
      content,
      sourceForumTopicId,
      prismaClient: prisma,
      getPointsBreakdown: getUserPointsBreakdown,
      config,
    });

    const io = event.context.io;
    if (io) {
      const roomId = result.room.id.toString();
      io.to(`user:${user.userId}`).emit("chat:room_updated", result.room);
      io.to(`user:${recipientId}`).emit("chat:room_updated", result.room);
      if (result.message) {
        io.to(roomId).emit("receive_message", result.message);
        io.to(`user:${recipientId}`).emit("notification:new", {
          type: "private_message",
          relatedId: result.room.id,
        });
      }
    }

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    if (error?.statusCode) {
      throw createError({
        statusCode: error.statusCode,
        statusMessage: error.statusMessage || error.message,
        message: error.message,
        data: error.data,
      });
    }

    console.error("发起私信失败:", error);
    throw createError({
      statusCode: 500,
      message: "发起私信失败",
    });
  }
});
