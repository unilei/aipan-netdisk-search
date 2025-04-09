import prisma from '~/lib/prisma'

// 获取特定聊天室的详细信息
export default defineEventHandler(async (event) => {
  try {
    // 验证用户身份
     // 验证用户身份
    const user = event.context.user
    if (!user || !user.userId) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
        message: "请先登录"
      })
    }
    const id = Number(event.context.params?.id)
    if (isNaN(id)) {
      throw createError({
        statusCode: 400,
        message: '无效的聊天室ID'
      })
    }
    
    // 检查用户是否有权限访问该聊天室
    const userRoom = await prisma.chatRoomUser.findUnique({
      where: {
        userId_roomId: {
          userId: user.userId,
          roomId: id
        }
      }
    })
    
    if (!userRoom) {
      // 检查聊天室是否为公开的
      const room = await prisma.chatRoom.findUnique({
        where: { id }
      })
      
      if (!room || !room.isPublic) {
        throw createError({
          statusCode: 403,
          message: '您没有权限访问此聊天室'
        })
      }
    }
    
    // 获取聊天室详细信息
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarStyle: true,
                role: true
              }
            }
          }
        },
        creator: {
          select: {
            id: true,
            username: true,
            avatarStyle: true,
            role: true
          }
        }
      }
    })
    
    if (!chatRoom) {
      throw createError({
        statusCode: 404,
        message: '聊天室不存在'
      })
    }
    
    // 格式化返回结果
    return {
      id: chatRoom.id,
      name: chatRoom.name,
      description: chatRoom.description,
      type: chatRoom.type,
      isPublic: chatRoom.isPublic,
      createdAt: chatRoom.createdAt,
      updatedAt: chatRoom.updatedAt,
      creator: chatRoom.creator,
      members: chatRoom.users.map((user: any) => ({
        id: user.user.id,
        username: user.user.username,
        avatarStyle: user.user.avatarStyle,
        role: user.user.role,
        chatRole: user.role,
        joinedAt: user.joinedAt
      })),
      // 对于私聊，提供一个便于显示的名称
      displayName: chatRoom.type === 'private' && chatRoom.name.startsWith('private_') 
        ? chatRoom.users.find((u: any) => u.userId !== user.userId)?.user?.username || chatRoom.name
        : chatRoom.name
    }
  } catch (error: any) {
    console.error('获取聊天室详情失败:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '获取聊天室详情失败'
    })
  }
})
