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
    const body = await readBody(event)
    const { categoryId, title, path, icon, description, sortOrder, isActive, target } = body

    if (!id || isNaN(id)) {
      throw createError({
        statusCode: 400,
        statusMessage: '无效的导航项ID'
      })
    }

    // 验证必填字段
    if (!categoryId || !title || !path || !icon) {
      throw createError({
        statusCode: 400,
        statusMessage: '分类ID、标题、路径和图标不能为空'
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

    // 检查分类是否存在
    const category = await prisma.navigationCategory.findUnique({
      where: { id: categoryId }
    })

    if (!category) {
      throw createError({
        statusCode: 400,
        statusMessage: '指定的分类不存在'
      })
    }

    // 更新导航项
    const item = await prisma.navigationItem.update({
      where: { id },
      data: {
        categoryId,
        title,
        path,
        icon,
        description: description || null,
        sortOrder: sortOrder || 0,
        isActive: isActive !== undefined ? isActive : true,
        target: target || '_self'
      },
      include: {
        category: true
      }
    })

    return {
      code: 200,
      msg: '导航项更新成功',
      data: item
    }
  } catch (error: any) {
    console.error('更新导航项失败:', error)
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: '更新导航项失败'
    })
  }
})
