import prisma from "~/lib/prisma"
import slugify from 'slugify'

export default defineEventHandler(async (event) => {
    try {
        // 检查管理员权限
        const user = event.context.user
        if (!user || user.role !== 'admin') {
            throw createError({
                statusCode: 403,
                statusMessage: "Forbidden",
                message: "需要管理员权限"
            })
        }

        const id = event.context.params?.id
        if (!id) {
            return {
                success: false,
                message: '分类ID不能为空'
            }
        }

        const body = await readBody(event)
        const { name, description, icon, order, slug } = body

        // 验证
        if (!name || !description || !slug) {
            return {
                success: false,
                message: '分类名称、描述和URL标识不能为空'
            }
        }

        // 验证slug格式
        if (!/^[a-z0-9-]+$/.test(slug)) {
            return {
                success: false,
                message: 'URL标识格式不正确，只能包含小写字母、数字和连字符'
            }
        }

        // 检查名称和slug是否已存在（排除当前编辑的分类）
        const existingCategory = await prisma.forumCategory.findFirst({
            where: {
                OR: [
                    { name },
                    { slug }
                ],
                NOT: {
                    id: parseInt(id)
                }
            }
        })

        if (existingCategory) {
            return {
                success: false,
                message: '分类名称或URL已存在'
            }
        }

        // 更新分类
        const category = await prisma.forumCategory.update({
            where: { id: parseInt(id) },
            data: {
                name,
                description,
                slug,
                icon: icon || null,
                order: order !== undefined ? parseInt(order) : 0,
            }
        })

        return {
            success: true,
            data: category
        }
    } catch (error: any) {
        console.error('更新论坛分类失败:', error)
        if (error.statusCode) {
            throw error
        }
        return {
            success: false,
            message: '更新论坛分类失败'
        }
    }
}) 