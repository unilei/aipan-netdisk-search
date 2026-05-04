import prisma from "~/lib/prisma"

export default defineEventHandler(async (event) => {
    try {
        // 检查用户是否已登录
        const user = event.context.user
        if (!user || !user.userId) {
            throw createError({
                statusCode: 401,
                statusMessage: "Unauthorized",
                message: "请先登录"
            })
        }

        // 获取主题ID
        const id = parseInt(event.context.params?.id || '')
        if (!id || isNaN(id)) {
            return {
                success: false,
                message: '无效的主题ID'
            }
        }

        // 检查主题是否存在且属于当前用户
        const topic = await prisma.forumTopic.findUnique({
            where: { id }
        })

        if (!topic) {
            return {
                success: false,
                message: '主题不存在'
            }
        }

        // 用户需要是作者或者管理员才能删除
        if (topic.authorId !== user.userId && user.role !== 'admin') {
            throw createError({
                statusCode: 403,
                statusMessage: "Forbidden",
                message: "您无权删除此主题"
            })
        }

        // 先删除主题下的所有回复
        await prisma.forumPost.deleteMany({
            where: { topicId: id }
        })

        // 删除主题
        await prisma.forumTopic.delete({
            where: { id }
        })

        return {
            success: true,
            message: '主题及其回复已成功删除'
        }
    } catch (error: any) {
        console.error('删除主题失败:', error)
        if (error.statusCode) {
            throw error
        }
        return {
            success: false,
            message: '删除主题失败'
        }
    }
}) 