import prisma from '~/lib/prisma'

const USER_SELECT = {
  id: true,
  username: true,
  avatarStyle: true,
  role: true,
}

const ROOM_INCLUDE = {
  users: {
    include: {
      user: {
        select: USER_SELECT,
      },
    },
  },
  creator: {
    select: USER_SELECT,
  },
  messages: {
    orderBy: {
      createdAt: 'desc',
    },
    take: 1,
    include: {
      user: {
        select: USER_SELECT,
      },
    },
  },
  _count: {
    select: {
      messages: true,
    },
  },
}

const toValidRoomType = (value: unknown) => {
  const type = String(value || '')
  return ['private', 'group'].includes(type) ? type : null
}

const getRecipient = (room: any, currentUserId: number) =>
  room.type === 'private'
    ? room.users.find((member: any) => member.user.id !== currentUserId)?.user || null
    : null

const getUnreadCount = async ({
  room,
  currentUserId,
  membership,
}: {
  room: any
  currentUserId: number
  membership?: any
}) => {
  if (!membership) return 0

  return prisma.chatMessage.count({
    where: {
      roomId: room.id,
      userId: { not: currentUserId },
      ...(membership.lastReadAt
        ? {
            createdAt: {
              gt: membership.lastReadAt,
            },
          }
        : {}),
    },
  })
}

const toRoomPayload = async ({
  room,
  currentUserId,
  membership,
}: {
  room: any
  currentUserId: number
  membership?: any
}) => {
  const recipient = getRecipient(room, currentUserId)
  const lastMessage = room.messages?.[0] || null
  const unreadCount = await getUnreadCount({ room, currentUserId, membership })

  return {
    id: room.id,
    name: room.name,
    description: room.description,
    type: room.type,
    isPublic: room.isPublic,
    privateKey: room.privateKey,
    sourceForumTopicId: room.sourceForumTopicId,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
    lastMessageAt: room.lastMessageAt || lastMessage?.createdAt || room.updatedAt,
    creator: room.creator,
    recipient,
    memberCount: room.users.length,
    messageCount: room._count.messages,
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
    displayName:
      room.type === 'private'
        ? recipient?.username || room.name
        : room.name,
  }
}

// 获取用户的聊天室列表
export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user || !user.userId) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
        message: "请先登录"
      })
    }

    const query = getQuery(event)
    const showPublic = query.public === 'true'
    const requestedType = toValidRoomType(query.type)

    if (showPublic) {
      const rooms = await prisma.chatRoom.findMany({
        where: {
          isPublic: true,
          ...(requestedType ? { type: requestedType } : {}),
        },
        include: ROOM_INCLUDE,
        orderBy: [
          { lastMessageAt: 'desc' },
          { updatedAt: 'desc' },
        ],
      })

      return Promise.all(
        rooms.map((room: any) =>
          toRoomPayload({
            room,
            currentUserId: user.userId,
          }),
        ),
      )
    }

    const userRooms = await prisma.chatRoomUser.findMany({
      where: {
        userId: user.userId,
        ...(requestedType
          ? {
              room: {
                type: requestedType,
              },
            }
          : {}),
      },
      include: {
        room: {
          include: ROOM_INCLUDE,
        },
      },
      orderBy: [
        {
          room: {
            lastMessageAt: 'desc',
          },
        },
        {
          room: {
            updatedAt: 'desc',
          },
        },
      ],
    })

    return Promise.all(
      userRooms.map((membership: any) =>
        toRoomPayload({
          room: membership.room,
          currentUserId: user.userId,
          membership,
        }),
      ),
    )
  } catch (error: any) {
    console.error('获取聊天室列表失败:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '获取聊天室列表失败'
    })
  }
})
