import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    // 确保用户已登录
    if (!event.context.user?.userId) {
      throw createError({
        statusCode: 401,
        message: '请先登录'
      })
    }

    const userId = event.context.user.userId

    // 获取用户的资源数量（所有状态）
    const resourceCount = await prisma.userResource.count({
      where: {
        creatorId: userId
      }
    })

    // 获取用户的文章数量（所有状态）
    const postCount = await prisma.blogPost.count({
      where: {
        authorId: userId
      }
    })

    return {
      code: 200,
      message: '获取统计数据成功',
      data: {
        resourceCount,
        postCount
      }
    }
  } catch (error: any) {
    console.error('获取统计数据失败:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '获取统计数据失败'
    })
  }
}) 