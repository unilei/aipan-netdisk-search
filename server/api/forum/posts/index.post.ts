import prisma from "~/lib/prisma"
import sensitiveWordFilter from '~/utils/sensitiveWordFilter'

export default defineEventHandler(async (event) => {
    // 过滤并解析评论内容

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

        // 判断用户角色，管理员创建的回复直接审核通过 暂时所有的都approved
        const status = user.role === 'admin' ? 'approved' : 'approved';

        // 创建回复，添加状态字段
        const post = await prisma.forumPost.create({
            data: {
                content: sensitiveWordFilter.filter(content),
                topicId: parseInt(topicId),
                authorId: user.userId,
                status: status // 添加状态字段，非管理员创建的回复默认为待审核状态
            }
        })

        // 如果是已审核状态，则更新主题的最后活动时间
        if (status === 'approved') {
            await prisma.forumTopic.update({
                where: { id: parseInt(topicId) },
                data: { lastActivityAt: new Date() }
            })
        }

        return {
            success: true,
            message: status === 'approved' ? '回复已发布' : '回复已提交，等待审核',
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