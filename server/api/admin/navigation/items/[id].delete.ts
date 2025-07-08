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
        statusMessage: '无效的导航项ID'
      })
    }

    // 检查导航项是否存在
    const existingItem = await prisma.navigationItem.findUnique({
      where: { id }
    })

    if (!existingItem) {
      throw createError({
        statusCode: 404,
        statusMessage: '导航项不存在'
      })
    }

    // 删除导航项
    await prisma.navigationItem.delete({
      where: { id }
    })

    return {
      code: 200,
      msg: '导航项删除成功',
      data: null
    }
  } catch (error: any) {
    console.error('删除导航项失败:', error)
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: '删除导航项失败'
    })
  }
})
