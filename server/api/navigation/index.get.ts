import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    // 获取启用的导航分类和导航项
    const categories = await prisma.navigationCategory.findMany({
      where: {
        isActive: true
      },
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

    // 转换为前端需要的格式
    const formattedCategories = categories.map((category: any) => ({
      id: category.slug,
      name: category.name,
      items: category.items.map((item: any) => ({
        path: item.path,
        title: item.title,
        icon: item.icon,
        description: item.description,
        target: item.target
      }))
    }))

    // 为公开导航API设置适当的缓存策略（5分钟）
    setHeader(event, 'Cache-Control', 'public, max-age=300, s-maxage=300')

    return {
      success: true,
      data: formattedCategories
    }
  } catch (error) {
    console.error('获取导航数据失败:', error)
    throw createError({
      statusCode: 500,
      statusMessage: '获取导航数据失败'
    })
  }
})
