import {
  normalizePrivateMessageConfig,
  resolvePrivateMessageStartEligibility,
} from "../points/privateMessageEligibility.mjs";

const PRIVATE_MESSAGE_PREVIEW_LENGTH = 80;

const PRIVATE_ROOM_INCLUDE = {
  users: {
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatarStyle: true,
          role: true,
          status: true,
        },
      },
    },
  },
  messages: {
    orderBy: { createdAt: "desc" },
    take: 1,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatarStyle: true,
          role: true,
        },
      },
    },
  },
};

const toPositiveInteger = (value, fieldName) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw createPrivateConversationError(400, `${fieldName}无效`);
  }
  return parsed;
};

export const createPrivateConversationError = (
  statusCode,
  message,
  data = {},
) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.statusMessage = message;
  error.data = data;
  return error;
};

export const buildPrivateRoomKey = (firstUserId, secondUserId) => {
  const first = toPositiveInteger(firstUserId, "用户ID");
  const second = toPositiveInteger(secondUserId, "用户ID");

  if (first === second) {
    throw createPrivateConversationError(400, "不能给自己发送私信");
  }

  return [first, second].sort((a, b) => a - b).join(":");
};

export const createPrivateRoomName = (privateKey) =>
  `private_${String(privateKey).replace(":", "_")}`;

const selectRecipientFromRoom = (room, currentUserId, fallbackRecipient) => {
  const recipientMember = room?.users?.find(
    (member) => Number(member.userId || member.user?.id) !== Number(currentUserId),
  );
  return recipientMember?.user || fallbackRecipient || null;
};

const toRecipientPayload = (recipient) => {
  if (!recipient) return null;
  return {
    id: recipient.id,
    username: recipient.username,
    avatarStyle: recipient.avatarStyle,
    role: recipient.role,
  };
};

export const toPrivateRoomPayload = ({
  room,
  currentUserId,
  recipient,
  unreadCount = 0,
}) => {
  const resolvedRecipient = selectRecipientFromRoom(
    room,
    currentUserId,
    recipient,
  );
  const lastMessage = Array.isArray(room?.messages) ? room.messages[0] : null;

  return {
    id: room.id,
    name: room.name,
    displayName: resolvedRecipient?.username || room.name,
    description: room.description,
    type: room.type,
    isPublic: room.isPublic,
    privateKey: room.privateKey,
    sourceForumTopicId: room.sourceForumTopicId,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
    lastMessageAt: room.lastMessageAt || room.updatedAt,
    recipient: toRecipientPayload(resolvedRecipient),
    memberCount: room.users?.length || 2,
    unreadCount,
    lastMessage: lastMessage
      ? {
          id: lastMessage.id,
          content: lastMessage.content,
          type: lastMessage.type,
          createdAt: lastMessage.createdAt,
          userId: lastMessage.userId,
          user: lastMessage.user,
        }
      : null,
  };
};

const normalizeContent = (content) =>
  typeof content === "string" ? content.trim() : "";

const buildMessagePreview = (content) => {
  const normalized = normalizeContent(content).replace(/\s+/g, " ");
  if (normalized.length <= PRIVATE_MESSAGE_PREVIEW_LENGTH) return normalized;
  return `${normalized.slice(0, PRIVATE_MESSAGE_PREVIEW_LENGTH)}...`;
};

const getDefaultPrismaClient = async () => {
  const module = await import("../../../lib/prisma.js");
  return module.default;
};

const getDefaultPointsBreakdown = async (userId, options) => {
  const module = await import("../points/userPoints.ts");
  return module.getUserPointsBreakdown(userId, options);
};

export const startPrivateConversation = async ({
  actor,
  recipientId,
  content,
  sourceForumTopicId = null,
  prismaClient,
  getPointsBreakdown = getDefaultPointsBreakdown,
  config = {},
  now = new Date(),
} = {}) => {
  const actorId = toPositiveInteger(actor?.id ?? actor?.userId, "当前用户ID");
  const normalizedRecipientId = toPositiveInteger(recipientId, "收件人ID");
  const privateKey = buildPrivateRoomKey(actorId, normalizedRecipientId);
  const client = prismaClient || (await getDefaultPrismaClient());
  const normalizedConfig = normalizePrivateMessageConfig(config);
  const firstMessageContent = normalizeContent(content);

  return client.$transaction(async (tx) => {
    const recipient = await tx.user.findUnique({
      where: { id: normalizedRecipientId },
      select: {
        id: true,
        username: true,
        avatarStyle: true,
        role: true,
        status: true,
      },
    });

    if (!recipient || recipient.status !== "active") {
      throw createPrivateConversationError(404, "私信用户不存在或不可用");
    }

    const existingRoom = await tx.chatRoom.findUnique({
      where: { privateKey },
      include: PRIVATE_ROOM_INCLUDE,
    });

    if (existingRoom) {
      let message = null;
      if (firstMessageContent) {
        message = await createPrivateMessage({
          tx,
          roomId: existingRoom.id,
          senderId: actorId,
          recipient,
          content: firstMessageContent,
          now,
          sourceForumTopicId,
          senderUsername: actor?.username,
        });
      }

      return {
        created: false,
        room: toPrivateRoomPayload({
          room: existingRoom,
          currentUserId: actorId,
          recipient,
        }),
        message,
        eligibility: null,
      };
    }

    const pointsBreakdown = await getPointsBreakdown(actorId, {
      client: tx,
      now,
    });
    const eligibility = resolvePrivateMessageStartEligibility({
      user: actor,
      pointsBreakdown,
      config: normalizedConfig,
    });

    if (!eligibility.allowed) {
      throw createPrivateConversationError(403, eligibility.message, {
        reason: eligibility.reason,
        requiredPoints: eligibility.requiredPoints,
        currentPoints: eligibility.currentPoints,
      });
    }

    const room = await tx.chatRoom.create({
      data: {
        name: createPrivateRoomName(privateKey),
        type: "private",
        isPublic: false,
        privateKey,
        sourceForumTopicId: sourceForumTopicId || null,
        lastMessageAt: firstMessageContent ? now : null,
        creator: {
          connect: { id: actorId },
        },
      },
      include: PRIVATE_ROOM_INCLUDE,
    });

    await tx.chatRoomUser.createMany({
      data: [
        {
          userId: actorId,
          roomId: room.id,
          role: "admin",
          lastReadAt: now,
        },
        {
          userId: normalizedRecipientId,
          roomId: room.id,
          role: "member",
          lastReadAt: null,
        },
      ],
    });

    let message = null;
    if (firstMessageContent) {
      message = await createPrivateMessage({
        tx,
        roomId: room.id,
        senderId: actorId,
        recipient,
        content: firstMessageContent,
        now,
        sourceForumTopicId,
        senderUsername: actor?.username,
      });
    }

    return {
      created: true,
      room: toPrivateRoomPayload({
        room,
        currentUserId: actorId,
        recipient,
      }),
      message,
      eligibility,
    };
  });
};

export const createPrivateMessage = async ({
  tx,
  roomId,
  senderId,
  recipient,
  content,
  now = new Date(),
  sourceForumTopicId = null,
  senderUsername,
}) => {
  const message = await tx.chatMessage.create({
    data: {
      content,
      type: "text",
      user: {
        connect: { id: senderId },
      },
      room: {
        connect: { id: roomId },
      },
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatarStyle: true,
          role: true,
        },
      },
    },
  });

  await tx.chatRoom.update({
    where: { id: roomId },
    data: {
      updatedAt: now,
      lastMessageAt: now,
      ...(sourceForumTopicId ? { sourceForumTopicId } : {}),
    },
  });

  await tx.notification.create({
    data: {
      userId: recipient.id,
      type: "private_message",
      title: "收到新的私信",
      content: `${senderUsername || message.user?.username || "用户"}：${buildMessagePreview(content)}`,
      relatedId: roomId,
    },
  });

  return message;
};
