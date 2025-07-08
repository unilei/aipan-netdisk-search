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

    const body = await readBody(event)
    const { categoryId, title, path, icon, description, sortOrder, isActive, target } = body

    // 验证必填字段
    if (!categoryId || !title || !path || !icon) {
      throw createError({
        statusCode: 400,
        statusMessage: '分类ID、标题、路径和图标不能为空'
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

    // 创建新导航项
    const item = await prisma.navigationItem.create({
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
      msg: '导航项创建成功',
      data: item
    }
  } catch (error: any) {
    console.error('创建导航项失败:', error)
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: '创建导航项失败'
    })
  }
})
