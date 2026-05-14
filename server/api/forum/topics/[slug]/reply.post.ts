import prisma from "~/lib/prisma"
import {
    evaluateModerationWithConfig,
    MODERATION_CONTEXTS,
    summarizeModerationDecision,
} from "~/server/utils/moderation";
import { updateForumReadStatesForApprovedReply } from "~/server/services/forum/readStates.mjs";
import { FORUM_TOPIC_PUBLIC_STATUS } from "~/server/services/forum/topicTrash.mjs";

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
        const topic = await prisma.forumTopic.findFirst({
            where: {
                slug: decodeURI(slug),
                status: FORUM_TOPIC_PUBLIC_STATUS,
            },
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

        const moderation = await evaluateModerationWithConfig(content, {
            context: MODERATION_CONTEXTS.forumReply,
        })
        if (!moderation.allowed) {
            return {
                success: false,
                message: moderation.message || '回复包含敏感信息，请修改后重新提交',
                moderation: summarizeModerationDecision(moderation)
            }
        }

        const status = user.role === 'admin' || !moderation.needsReview
            ? 'approved'
            : 'pending';

        // 创建回复，添加状态字段
        const post = await prisma.forumPost.create({
            data: {
                content,
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
        let activeTopic = topic;
        if (status === 'approved') {
            activeTopic = await prisma.forumTopic.update({
                where: { id: topic.id },
                data: { lastActivityAt: new Date() },
                include: { author: true }
            })
        }
        const userData = await prisma.user.findUnique({
            where: { id: user.userId },
        })

        if (status !== "approved") {
            return {
                success: true,
                message: '回复已提交，等待审核',
                data: post
            }
        }

        // 获取需要通知的用户ID列表(去重)
        let notifyUserIds = new Set<number>();

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

        const createdNotifications: any[] = [];

        // 为每个需要通知的用户创建相应的通知
        for (const userId of notifyUserIds) {
            let notificationContent = '';

            // 根据用户身份生成不同的通知内容
            if (userId === topic.authorId) {
                notificationContent = `用户 ${userData?.username || "用户"} 在您的主题 "${topic.title}" 中发表了新回复`;
            } else {
                notificationContent = `用户 ${userData?.username || "用户"} 回复了您在主题 "${topic.title}" 中的评论`;
            }

            const notification = await prisma.notification.create({
                data: {
                    userId: userId,
                    type: 'reply',
                    title: '收到新回复',
                    content: notificationContent,
                    relatedId: post.id
                }
            });
            createdNotifications.push(notification);
        }

        const unreadTargets = await updateForumReadStatesForApprovedReply({
            topic: activeTopic,
            post,
            actorId: user.userId,
            authorUsername: userData?.username || "用户",
            prismaClient: prisma,
        });

        const io = event.context.io;
        if (io) {
            for (const target of unreadTargets) {
                io.to(`user:${target.userId}`).emit("forum:new_reply", target.payload);
            }

            for (const notification of createdNotifications) {
                io.to(`user:${notification.userId}`).emit("notification:new", notification);
            }
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
