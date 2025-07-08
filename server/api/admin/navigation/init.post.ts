import prisma from "~/lib/prisma";
import { readFileSync } from 'fs'
import { join } from 'path'

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

    console.log('开始初始化导航数据...')

    // 检查是否已有数据
    const existingCategories = await prisma.navigationCategory.count()
    if (existingCategories > 0) {
      return {
        code: 200,
        msg: '导航数据已存在，跳过初始化',
        data: null
      }
    }

    // 读取配置文件
    const configPath = join(process.cwd(), 'assets/navigation/config.json')
    const configData = JSON.parse(readFileSync(configPath, 'utf-8'))

    // 转换配置文件数据为数据库格式
    const categories = configData.categories.map((category: any, index: number) => ({
      name: category.name,
      slug: category.id,
      sortOrder: index + 1,
      isActive: true,
      items: category.items.map((item: any, itemIndex: number) => ({
        title: item.title,
        path: item.path,
        icon: item.icon,
        description: item.description || '',
        sortOrder: itemIndex + 1,
        target: item.path.startsWith('http') ? '_blank' : '_self',
        isActive: true
      }))
    }))

    // 创建分类和导航项
    for (const categoryData of categories) {
      const { items, ...categoryInfo } = categoryData

      // 创建分类
      const category = await prisma.navigationCategory.create({
        data: categoryInfo
      })

      console.log(`创建分类: ${category.name}`)

      // 创建导航项
      for (const itemData of items) {
        const item = await prisma.navigationItem.create({
          data: {
            ...itemData,
            categoryId: category.id
          }
        })
        console.log(`  - 创建导航项: ${item.title}`)
      }
    }

    return {
      code: 200,
      msg: '导航数据初始化完成！',
      data: {
        categoriesCount: categories.length,
        itemsCount: categories.reduce((sum: number, cat: any) => sum + cat.items.length, 0)
      }
    }
  } catch (error: any) {
    console.error('初始化导航数据失败:', error)
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: '初始化导航数据失败'
    })
  }
})
