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

    const query = getQuery(event)
    const categoryId = query.categoryId ? parseInt(query.categoryId as string) : undefined

    // 构建查询条件
    const where = categoryId ? { categoryId } : {}

    // 获取导航项
    const items = await prisma.navigationItem.findMany({
      where,
      include: {
        category: true
      },
      orderBy: [
        { categoryId: 'asc' },
        { sortOrder: 'asc' }
      ]
    })

    // 设置缓存控制头，防止浏览器缓存
    setHeader(event, 'Cache-Control', 'no-cache, no-store, must-revalidate')
    setHeader(event, 'Pragma', 'no-cache')
    setHeader(event, 'Expires', '0')

    return {
      code: 200,
      msg: '获取成功',
      data: items
    }
  } catch (error: any) {
    console.error('获取导航项失败:', error)
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: '获取导航项失败'
    })
  }
})
