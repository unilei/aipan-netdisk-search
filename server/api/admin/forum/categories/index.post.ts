import prisma from "~/lib/prisma"
import GithubSlugger from 'github-slugger'

export default defineEventHandler(async (event) => {
    try {
        // 权限验证
        const user = event.context.user
        if (!user || user.role !== "admin") {
            throw createError({
                statusCode: 403,
                statusMessage: "Forbidden",
                message: "需要管理员权限"
            })
        }

        // 获取请求体
        const body = await readBody(event)
        const { name, slug, description, icon, order } = body

        // 验证必填字段
        if (!name || !description) {
            return {
                success: false,
                message: '分类名称和描述不能为空'
            }
        }

        // 生成slug，如果没有提供
        let finalSlug = slug
        if (!finalSlug) {
            const slugger = new GithubSlugger()
            finalSlug = slugger.slug(name)
        }

        // 检查slug是否已存在
        const existingCategory = await prisma.forumCategory.findFirst({
            where: {
                slug: finalSlug
            }
        })

        if (existingCategory) {
            return {
                success: false,
                message: '该URL标识已存在，请使用其他的URL标识'
            }
        }

        // 创建新分类
        const newCategory = await prisma.forumCategory.create({
            data: {
                name,
                slug: finalSlug,
                description,
                icon: icon || 'fa fa-folder',
                order: order ? parseInt(order) : 0
            }
        })

        return {
            success: true,
            message: '分类创建成功',
            data: newCategory
        }
    } catch (error) {
        console.error('创建分类失败:', error)
        return {
            success: false,
            message: '创建分类失败'
        }
    }
}) 