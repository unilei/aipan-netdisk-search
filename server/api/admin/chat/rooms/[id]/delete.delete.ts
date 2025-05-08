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
    // 获取路径参数
    const params = event.context.params || {}
    const roomId = parseInt(params.id || '0')
    
    if (!roomId) {
      throw createError({
        statusCode: 400,
        message: '无效的聊天室ID'
      })
    }
    
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
    
    // 删除聊天室 (级联删除将自动处理相关的用户关系和消息)
    await prisma.chatRoom.delete({
      where: { id: roomId }
    })
    
    return { success: true, message: '聊天室删除成功' }
  } catch (error) {
    console.error('删除聊天室失败:', error)
    throw createError({
      statusCode: 500,
      message: '删除聊天室失败'
    })
  }
})
