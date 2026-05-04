import prisma from "~/lib/prisma"

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

        // 统计论坛主题数量
        const count = await prisma.forumTopic.count()

        return {
            success: true,
            count
        }
    } catch (error) {
        console.error('获取论坛主题统计失败:', error)
        return {
            success: false,
            message: '获取论坛主题统计失败'
        }
    }
}) 