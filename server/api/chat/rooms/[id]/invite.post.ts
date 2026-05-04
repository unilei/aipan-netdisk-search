import jwt from 'jsonwebtoken'
import { H3Error } from 'h3'
import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    // 验证用户身份
    const token = getHeader(event, 'Authorization')?.replace('Bearer ', '')
    if (!token) {
      throw createError({
        statusCode: 401,
        message: '未授权访问'
      })
    }

    const jwtSecret = useRuntimeConfig().jwtSecret
    const decoded = jwt.verify(token, jwtSecret) as { userId: number }

    // 获取聊天室ID
    const roomId = parseInt(event.context.params?.id || '')
    if (isNaN(roomId)) {
      throw createError({
        statusCode: 400,
        message: '无效的聊天室ID'
      })
    }

    // 获取被邀请用户ID
    const body = await readBody(event)
    const userId = parseInt(body.userId)

    if (isNaN(userId)) {
      throw createError({
        statusCode: 400,
        message: '无效的用户ID'
      })
    }

    // 验证聊天室存在
    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: { creator: true }
    })

    if (!room) {
      throw createError({
        statusCode: 404,
        message: '聊天室不存在'
      })
    }

    // 验证当前用户是否是创建者
    if (room.creatorId !== decoded.userId) {
      throw createError({
        statusCode: 403,
        message: '只有聊天室创建者可以邀请用户'
      })
    }

    // 检查被邀请用户是否已经在聊天室中
    const existingMember = await prisma.chatRoomUser.findUnique({
      where: {
        userId_roomId: {
          userId,
          roomId
        }
      }
    })

    if (existingMember) {
      throw createError({
        statusCode: 400,
        message: '该用户已经是聊天室成员'
      })
    }

    // 检查被邀请用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      throw createError({
        statusCode: 404,
        message: '用户不存在'
      })
    }

    // 添加用户到聊天室
    const chatRoomUser = await prisma.chatRoomUser.create({
      data: {
        userId,
        roomId
      }
    })

    // 查询当前聊天室是否需要更新
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: roomId }
    })

    if (chatRoom) {
      // 更新聊天室的最后更新时间
      await prisma.chatRoom.update({
        where: { id: roomId },
        data: { 
          updatedAt: new Date()
        }
      })
    }

    // 创建一条系统消息，通知聊天室有新成员加入
    await prisma.chatMessage.create({
      data: {
        roomId,
        userId: decoded.userId,
        content: `邀请了 ${user.username} 加入聊天室`,
        // 使用与模型兼容的类型
        type: 'system'
      }
    })

    return {
      success: true,
      message: '邀请成功',
      user: {
        id: user.id,
        username: user.username
      }
    }

  } catch (error) {
    console.error('邀请用户失败:', error)
    
    if (error instanceof H3Error) {
      throw error
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      throw createError({
        statusCode: 401,
        message: '无效的身份凭证'
      })
    }

    throw createError({
      statusCode: 500,
      message: '服务器错误'
    })
  }
})
