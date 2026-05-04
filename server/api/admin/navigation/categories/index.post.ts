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
    const { name, slug, sortOrder, isActive } = body

    // 验证必填字段
    if (!name || !slug) {
      throw createError({
        statusCode: 400,
        statusMessage: '分类名称和标识符不能为空'
      })
    }

    // 检查slug是否已存在
    const existingCategory = await prisma.navigationCategory.findUnique({
      where: { slug }
    })

    if (existingCategory) {
      throw createError({
        statusCode: 400,
        statusMessage: '分类标识符已存在'
      })
    }

    // 创建新分类
    const category = await prisma.navigationCategory.create({
      data: {
        name,
        slug,
        sortOrder: sortOrder || 0,
        isActive: isActive !== undefined ? isActive : true
      }
    })

    return {
      code: 200,
      msg: '分类创建成功',
      data: category
    }
  } catch (error: any) {
    console.error('创建导航分类失败:', error)
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: '创建导航分类失败'
    })
  }
})
