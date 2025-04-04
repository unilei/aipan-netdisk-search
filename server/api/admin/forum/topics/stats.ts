import prisma from "~/lib/prisma"

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

        // 获取总主题数
        const count = await prisma.forumTopic.count()

        return {
            count
        }
    } catch (error: any) {
        console.error('获取论坛统计信息失败:', error)
        if (error.statusCode) {
            throw error
        }
        throw createError({
            statusCode: 500,
            message: '获取论坛统计信息失败'
        })
    }
}) 