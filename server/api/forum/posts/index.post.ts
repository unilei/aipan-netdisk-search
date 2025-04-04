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

        const body = await readBody(event)
        const { content, topicId } = body

        // 基本验证
        if (!content || !topicId) {
            return {
                success: false,
                message: '内容和主题ID不能为空'
            }
        }

        // 检查主题是否存在且未锁定
        const topic = await prisma.forumTopic.findUnique({
            where: { id: parseInt(topicId) }
        })

        if (!topic) {
            return {
                success: false,
                message: '主题不存在'
            }
        }

        if (topic.isLocked) {
            return {
                success: false,
                message: '该主题已锁定，无法回复'
            }
        }

        // 创建回复
        const post = await prisma.forumPost.create({
            data: {
                content,
                topicId: parseInt(topicId),
                authorId: user.userId,
            }
        })

        // 更新主题的最后活动时间
        await prisma.forumTopic.update({
            where: { id: parseInt(topicId) },
            data: { lastActivityAt: new Date() }
        })

        return {
            success: true,
            data: post
        }
    } catch (error: any) {
        console.error('创建回复失败:', error)
        if (error.statusCode) {
            throw error
        }
        return {
            success: false,
            message: '创建回复失败'
        }
    }
}) 