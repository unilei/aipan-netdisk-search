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
        const { name, description, icon, order } = body

        // 验证
        if (!name || !description) {
            return {
                success: false,
                message: '分类名称和描述不能为空'
            }
        }

        // 生成slug
        const slug = slugify(name, { lower: true, strict: true })

        // 检查名称是否已存在（排除当前编辑的分类）
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