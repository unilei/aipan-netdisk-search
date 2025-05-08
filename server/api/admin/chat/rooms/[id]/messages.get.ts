import { verifyToken } from '~/server/model/user'
import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  // 验证用户是否已登录并且是管理员
  const { token } = parseCookies(event)
  const decoded = token ? verifyToken(token) : null
  
  if (!decoded || !decoded.userId || decoded.role !== 'admin') {
    throw createError({
      statusCode: 401,
      message: '未授权的访问'
    })
  }

  try {
    // 获取路径参数和查询参数
    const params = event.context.params || {}
    const roomId = parseInt(params.id || '0')
    
    if (!roomId) {
      throw createError({
        statusCode: 400,
        message: '无效的聊天室ID'
      })
    }
    
    const query = getQuery(event)
    const page = Number(query.page) || 1
    const pageSize = Number(query.pageSize) || 20
    
    // 确认聊天室存在
    const roomExists = await prisma.chatRoom.findUnique({
      where: { id: roomId }
    })
    
    if (!roomExists) {
      throw createError({
        statusCode: 404,
        message: '聊天室不存在'
      })
    }
    
    // 获取总数
    const total = await prisma.chatMessage.count({
      where: { roomId }
    })
    
    // 获取消息列表
    const messages = await prisma.chatMessage.findMany({
      where: { roomId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarStyle: true
          }
        },
        replyTo: {
          include: {
            user: {
              select: {
                id: true,
                username: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * pageSize,
      take: pageSize
    })
    
    // 格式化消息数据，为前端提供一致的数据结构
    const formattedMessages = messages.map((message: any) => {
      return {
        id: message.id,
        content: message.content,
        createdAt: message.createdAt,
        replyToId: message.replyToId,
        // 将user重命名为sender以适配前端代码
        sender: {
          id: message.user.id,
          username: message.user.username,
          avatar: null // 前端期望有avatar字段，我们设为null
        },
        replyTo: message.replyTo ? {
          id: message.replyTo.id,
          content: message.replyTo.content,
          sender: {
            id: message.replyTo.user.id,
            username: message.replyTo.user.username
          }
        } : null
      };
    });
    
    return {
      data: formattedMessages,
      total,
      page,
      pageSize
    }
  } catch (error) {
    console.error('获取聊天消息失败:', error)
    throw createError({
      statusCode: 500,
      message: '获取聊天消息失败'
    })
  }
})
