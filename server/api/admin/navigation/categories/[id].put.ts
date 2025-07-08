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
    const { name, slug, sortOrder, isActive } = body

    if (!id || isNaN(id)) {
      throw createError({
        statusCode: 400,
        statusMessage: '无效的分类ID'
      })
    }

    // 验证必填字段
    if (!name || !slug) {
      throw createError({
        statusCode: 400,
        statusMessage: '分类名称和标识符不能为空'
      })
    }

    // 检查分类是否存在
    const existingCategory = await prisma.navigationCategory.findUnique({
      where: { id }
    })

    if (!existingCategory) {
      throw createError({
        statusCode: 404,
        statusMessage: '分类不存在'
      })
    }

    // 检查slug是否被其他分类使用
    const slugConflict = await prisma.navigationCategory.findFirst({
      where: {
        slug,
        id: { not: id }
      }
    })

    if (slugConflict) {
      throw createError({
        statusCode: 400,
        statusMessage: '分类标识符已被其他分类使用'
      })
    }

    // 更新分类
    const category = await prisma.navigationCategory.update({
      where: { id },
      data: {
        name,
        slug,
        sortOrder: sortOrder || 0,
        isActive: isActive !== undefined ? isActive : true
      }
    })

    return {
      code: 200,
      msg: '分类更新成功',
      data: category
    }
  } catch (error: any) {
    console.error('更新导航分类失败:', error)
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: '更新导航分类失败'
    })
  }
})
