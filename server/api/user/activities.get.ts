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

    // 获取最近的资源活动
    const resources = await prisma.userResource.findMany({
      where: {
        creatorId: userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5,
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true
      }
    })
 
    // 合并并格式化活动数据
    const activities = [
      ...resources.map((resource: { id: number; name: string; status: string; createdAt: Date }) => ({
        id: `resource-${resource.id}`,
        type: 'resource',
        content: `${resource.status === 'published' ? '发布' : '提交'}了资源《${resource.name}》`,
        createdAt: resource.createdAt
      })),
       
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10) // 只返回最近10条活动

    return {
      code: 200,
      message: '获取活动数据成功',
      data: activities
    }
  } catch (error: any) {
    console.error('获取活动数据失败:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '获取活动数据失败'
    })
  }
}) 