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

    const id = parseInt(getRouterParam(event, 'id') as string)

    if (!id || isNaN(id)) {
      throw createError({
        statusCode: 400,
        statusMessage: '无效的分类ID'
      })
    }

    // 检查分类是否存在
    const existingCategory = await prisma.navigationCategory.findUnique({
      where: { id },
      include: {
        items: true
      }
    })

    if (!existingCategory) {
      throw createError({
        statusCode: 404,
        statusMessage: '分类不存在'
      })
    }

    // 检查是否有关联的导航项
    if (existingCategory.items.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: '该分类下还有导航项，请先删除所有导航项'
      })
    }

    // 删除分类
    await prisma.navigationCategory.delete({
      where: { id }
    })

    return {
      code: 200,
      msg: '分类删除成功',
      data: null
    }
  } catch (error: any) {
    console.error('删除导航分类失败:', error)
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: '删除导航分类失败'
    })
  }
})
