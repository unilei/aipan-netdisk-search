import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    // 权限验证由中间件处理
    const user = event.context.user
    if (!user || user.role !== 'admin') {
      throw createError({
        statusCode: 403,
        statusMessage: '无权限访问'
      })
    }

    // 获取所有导航分类，包含导航项
    const categories = await prisma.navigationCategory.findMany({
      include: {
        items: {
          where: {
            isActive: true
          },
          orderBy: {
            sortOrder: 'asc'
          }
        }
      },
      orderBy: {
        sortOrder: 'asc'
      }
    })

    return {
      code: 200,
      msg: '获取成功',
      data: categories
    }
  } catch (error: any) {
    console.error('获取导航分类失败:', error)
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: '获取导航分类失败'
    })
  }
})
