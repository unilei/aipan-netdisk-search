import prisma from '~/lib/prisma'

// 发送一条聊天消息
export default defineEventHandler(async (event) => {
  try {
    // 验证用户身份
    const user = event.context.user
    if (!user || !user.userId) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
        message: "请先登录"
      })
    }
    const { roomId: rawRoomId, content, replyToId: rawReplyToId, type, fileUrl } = await readBody(event)
    
    // 确保roomId是整数类型
    const roomId = parseInt(rawRoomId, 10)
    // 如果replyToId存在，确保它也是整数类型
    const replyToId = rawReplyToId ? parseInt(rawReplyToId, 10) : undefined
    
    // 验证必要字段
    if (!roomId || isNaN(roomId) || !content) {
      throw createError({
        statusCode: 400,
        message: '聊天室ID和消息内容为必填项'
      })
    }
    
    // 验证用户是否有权限在该聊天室发送消息
    const userRoom = await prisma.chatRoomUser.findUnique({
      where: {
        userId_roomId: {
          userId: user.userId,
          roomId
        }
      }
    })
    
    // 如果用户不是聊天室成员，检查聊天室是否为公开的
    if (!userRoom) {
      const room = await prisma.chatRoom.findUnique({
        where: { id: roomId }
      })
      
      if (!room) {
        throw createError({
          statusCode: 404,
          message: '聊天室不存在'
        })
      }
      
      if (!room.isPublic) {
        throw createError({
          statusCode: 403,
          message: '您没有权限在此聊天室发送消息'
        })
      }
      
      // 如果是公开聊天室，自动将用户添加为成员
      await prisma.chatRoomUser.create({
        data: {
          userId: user.userId,
          roomId: roomId,
          role: 'member'
        }
      })
    }
    
    // 创建消息
    const message = await prisma.chatMessage.create({
      data: {
        content,
        type: type || 'text',
        fileUrl,
        user: {
          connect: { id: user.userId }
        },
        room: {
          connect: { id: roomId }
        },
        ...(replyToId && !isNaN(replyToId) && {
          replyTo: {
            connect: { id: replyToId }
          }
        })
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarStyle: true,
            role: true
          }
        },
        replyTo: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarStyle: true
              }
            }
          }
        }
      }
    })
    
    // 更新聊天室最后活动时间
    await prisma.chatRoom.update({
      where: { id: roomId },
      data: { updatedAt: new Date() }
    })
    
    // 通过 WebSocket 通知聊天室其他成员
    if (event.context.io) {
      const socketIo = event.context.io
      socketIo.to(roomId.toString()).emit('receive_message', message)
    }
    
    return message
  } catch (error: any) {
    console.error('发送消息失败:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '发送消息失败'
    })
  }
})
