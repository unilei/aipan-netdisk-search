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

        // 获取帖子ID
        const id = parseInt(event.context.params?.id || '')
        if (!id || isNaN(id)) {
            return {
                success: false,
                message: '无效的回复ID'
            }
        }

        // 检查帖子是否存在
        const post = await prisma.forumPost.findUnique({
            where: { id }
        })

        if (!post) {
            return {
                success: false,
                message: '回复不存在'
            }
        }

        // 更新帖子状态为已批准
        const updatedPost = await prisma.forumPost.update({
            where: { id },
            data: { status: 'approved' }
        })

        // 更新主题的最近活动时间
        await prisma.forumTopic.update({
            where: { id: post.topicId },
            data: { updatedAt: new Date() }
        })

        return {
            success: true,
            message: '回复已批准',
            data: updatedPost
        }
    } catch (error) {
        console.error('批准回复失败:', error)
        return {
            success: false,
            message: '批准回复失败'
        }
    }
}) 