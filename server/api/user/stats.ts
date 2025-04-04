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

        // 获取用户资源数量
        const resourceCount = await prisma.resource.count({
            where: {
                creatorId: user.userId
            }
        })

        // 获取用户文章数量
        const postCount = await prisma.post.count({
            where: {
                creatorId: user.userId
            }
        })

        // 获取用户论坛主题数量
        const forumTopicCount = await prisma.forumTopic.count({
            where: {
                authorId: user.userId
            }
        })

        // 获取用户论坛回复数量
        const forumPostCount = await prisma.forumPost.count({
            where: {
                authorId: user.userId
            }
        })

        // 统计不同状态的论坛主题数量
        const pendingTopics = await prisma.forumTopic.count({
            where: {
                authorId: user.userId,
                status: 'pending'
            }
        })

        const approvedTopics = await prisma.forumTopic.count({
            where: {
                authorId: user.userId,
                status: 'approved'
            }
        })

        const rejectedTopics = await prisma.forumTopic.count({
            where: {
                authorId: user.userId,
                status: 'rejected'
            }
        })

        // 统计不同状态的论坛回复数量
        const pendingPosts = await prisma.forumPost.count({
            where: {
                authorId: user.userId,
                status: 'pending'
            }
        })

        const approvedPosts = await prisma.forumPost.count({
            where: {
                authorId: user.userId,
                status: 'approved'
            }
        })

        const rejectedPosts = await prisma.forumPost.count({
            where: {
                authorId: user.userId,
                status: 'rejected'
            }
        })

        return {
            code: 200,
            data: {
                resourceCount,
                postCount,
                forumTopicCount,
                forumPostCount,
                forum: {
                    topics: {
                        total: forumTopicCount,
                        pending: pendingTopics,
                        approved: approvedTopics,
                        rejected: rejectedTopics
                    },
                    posts: {
                        total: forumPostCount,
                        pending: pendingPosts,
                        approved: approvedPosts,
                        rejected: rejectedPosts
                    }
                }
            }
        }
    } catch (error) {
        console.error('获取用户统计数据失败:', error)
        return {
            code: 500,
            message: '获取用户统计数据失败'
        }
    }
}) 