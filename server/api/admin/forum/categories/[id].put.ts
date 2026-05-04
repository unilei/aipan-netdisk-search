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

        // 获取分类ID
        const id = parseInt(event.context.params?.id || '')
        if (!id || isNaN(id)) {
            return {
                success: false,
                message: '无效的分类ID'
            }
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

        // 检查slug是否已被其他分类使用
        const existingCategory = await prisma.forumCategory.findFirst({
            where: {
                slug: finalSlug,
                id: { not: id }
            }
        })

        if (existingCategory) {
            return {
                success: false,
                message: '该URL标识已被其他分类使用'
            }
        }

        // 更新分类
        const updatedCategory = await prisma.forumCategory.update({
            where: { id },
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
            message: '分类更新成功',
            data: updatedCategory
        }
    } catch (error) {
        console.error('更新分类失败:', error)
        return {
            success: false,
            message: '更新分类失败'
        }
    }
}) 