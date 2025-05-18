import prisma from "~/lib/prisma"
import sensitiveWordFilter from '~/utils/sensitiveWordFilter'

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

        const { slug } = getRouterParams(event)

        if (!slug) {
            return {
                success: false,
                message: '主题不存在'
            }
        }

        const body = await readBody(event)
        const { content, parentId } = body

        // 基本验证
        if (!content) {
            return {
                success: false,
                message: '回复内容不能为空'
            }
        }

        // 检查主题是否存在且未锁定
        const topic = await prisma.forumTopic.findUnique({
            where: { slug: decodeURI(slug) },
            include: { author: true }
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

        // 判断用户角色，管理员创建的回复直接审核通过
        const status = user.role === 'admin' ? 'approved' : 'approved';

        // 创建回复，添加状态字段
        const post = await prisma.forumPost.create({
            data: {
                content: sensitiveWordFilter.filter(content),
                topicId: topic.id,
                authorId: user.userId,
                parentId: parentId ? parseInt(parentId) : null,
                status: status // 添加状态字段，非管理员创建的回复默认为待审核状态
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        avatarStyle: true,
                        createdAt: true,
                    }
                }
            }
        })

        // 如果是已审核状态，则更新主题的最后活动时间
        if (status === 'approved') {
            await prisma.forumTopic.update({
                where: { id: topic.id },
                data: { lastActivityAt: new Date() }
            })
        }
        const userData = await prisma.user.findUnique({
            where: { id: user.userId },
        })

        // 获取需要通知的用户ID列表(去重)
        let notifyUserIds = new Set();

        // 如果回复的是主题作者，且不是自己回复自己，则添加主题作者到通知列表
        if (topic.authorId !== user.userId) {
            notifyUserIds.add(topic.authorId);
        }

        // 如果回复的是其他用户的回复，且不是自己回复自己，则添加评论作者到通知列表
        if (parentId) {
            const parentPost = await prisma.forumPost.findUnique({
                where: { id: parseInt(parentId) },
                include: { author: true }
            })

            if (parentPost && parentPost.authorId !== user.userId && parentPost.authorId !== topic.authorId) {
                notifyUserIds.add(parentPost.authorId);
            }
        }

        // 为每个需要通知的用户创建相应的通知
        for (const userId of notifyUserIds) {
            let notificationContent = '';

            // 根据用户身份生成不同的通知内容
            if (userId === topic.authorId) {
                notificationContent = `用户 ${userData.username} 在您的主题 "${topic.title}" 中发表了新回复`;
            } else {
                notificationContent = `用户 ${userData.username} 回复了您在主题 "${topic.title}" 中的评论`;
            }

            await prisma.notification.create({
                data: {
                    userId: userId,
                    type: 'reply',
                    title: '收到新回复',
                    content: notificationContent,
                    relatedId: post.id
                }
            });
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