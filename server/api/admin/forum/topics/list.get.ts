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

        // 获取简化的主题列表，用于下拉选择框
        const topics = await prisma.forumTopic.findMany({
            select: {
                id: true,
                title: true,
                slug: true
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 100 // 限制返回数量，避免数据过多
        })

        return {
            success: true,
            data: topics
        }
    } catch (error) {
        console.error('获取主题列表失败:', error)
        return {
            success: false,
            message: '获取主题列表失败'
        }
    }
}) 