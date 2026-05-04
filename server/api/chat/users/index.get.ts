import prisma from '~/lib/prisma'

// 获取所有用户列表（用于选择私聊对象）
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
    
    // 获取当前用户信息
    const currentUserId = user.userId
    
    // 获取所有活跃用户，但排除当前用户
    const users = await prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        status: 'active'
      },
      select: {
        id: true,
        username: true,
        avatarStyle: true,
        role: true
      },
      orderBy: {
        username: 'asc'
      }
    })
    
    return users
  } catch (error: any) {
    console.error('获取用户列表失败:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '获取用户列表失败'
    })
  }
})
