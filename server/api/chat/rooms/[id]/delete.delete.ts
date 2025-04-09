import { PrismaClient } from '@prisma/client'
import { verifyToken } from '~/server/model/user'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    // 验证用户是否已登录
    const { token } = parseCookies(event)
    const decoded = token ? verifyToken(token) : null
    if (!decoded || !decoded.userId) {
      throw createError({
        statusCode: 401,
        message: '未授权的访问',
      })
    }

    const userId = decoded.userId
    const params = event.context.params || {}
    const roomId = parseInt(params.id || '0')
    
    if (!roomId) {
      throw createError({
        statusCode: 400,
        message: '无效的聊天室ID',
      })
    }

    // 获取房间信息
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: roomId },
    })

    if (!chatRoom) {
      throw createError({
        statusCode: 404,
        message: '聊天室不存在',
      })
    }

    // 只有创建者可以删除聊天室
    if (chatRoom.creatorId !== userId) {
      throw createError({
        statusCode: 403,
        message: '只有聊天室创建者可以删除聊天室',
      })
    }

    // 删除聊天室 (级联删除将自动处理相关的用户关系和消息)
    await prisma.chatRoom.delete({
      where: { id: roomId },
    })

    return {
      success: true,
      message: '聊天室删除成功',
    }
  } catch (error: any) {
    console.error('删除聊天室失败:', error)
    throw createError({
      statusCode: 500,
      message: `删除聊天室失败: ${error?.message || '未知错误'}`,
    })
  }
})
