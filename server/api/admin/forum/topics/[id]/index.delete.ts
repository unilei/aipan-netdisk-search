import prisma from "~/lib/prisma"
import { FORUM_TOPIC_TRASHED_STATUS } from "~/server/services/forum/topicTrash.mjs";

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

        // 获取主题ID
        const id = parseInt(event.context.params?.id || '')
        if (!id || isNaN(id)) {
            return {
                success: false,
                message: '无效的主题ID'
            }
        }

        // 检查主题是否存在
        const topic = await prisma.forumTopic.findUnique({
            where: { id }
        })

        if (!topic) {
            return {
                success: false,
                message: '主题不存在'
            }
        }

        if (topic.status !== FORUM_TOPIC_TRASHED_STATUS) {
            return {
                success: false,
                message: '请先将主题移入回收站，再执行永久删除'
            }
        }

        // 先删除所有相关的回复
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
    } catch (error) {
        console.error('删除主题失败:', error)
        return {
            success: false,
            message: '删除主题失败'
        }
    }
})
