import { PrismaClient } from '@prisma/client'
import { verifyToken } from '~/server/model/user'

const prisma = new PrismaClient()

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
    // 获取聊天室总数
    const count = await prisma.chatRoom.count()
    
    return {
      count
    }
  } catch (error) {
    console.error('获取聊天统计失败:', error)
    throw createError({
      statusCode: 500,
      message: '获取聊天统计失败'
    })
  }
})
