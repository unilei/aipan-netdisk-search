import prisma from "~/lib/prisma"

export default defineEventHandler(async (event) => {
    try {
        const slug = event.context.params?.slug

        if (!slug) {
            return {
                success: false,
                message: '主题不存在'
            }
        }

        // 获取主题详情
        const topic = await prisma.forumTopic.findUnique({
            where: { slug },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        avatarStyle: true,
                        createdAt: true,
                    }
                },
                category: true,
            }
        })

        if (!topic) {
            return {
                success: false,
                message: '主题不存在'
            }
        }

        // 获取帖子回复
        const query = getQuery(event)
        const page = query.page ? parseInt(query.page as string) : 1
        const pageSize = query.pageSize ? parseInt(query.pageSize as string) : 20

        const total = await prisma.forumPost.count({
            where: { topicId: topic.id }
        })

        const posts = await prisma.forumPost.findMany({
            where: { topicId: topic.id },
            orderBy: { createdAt: 'asc' },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        avatarStyle: true,
                        createdAt: true,
                    }
                }
            },
            skip: (page - 1) * pageSize,
            take: pageSize,
        })

        // 更新浏览次数
        await prisma.forumTopic.update({
            where: { id: topic.id },
            data: { viewCount: { increment: 1 } }
        })

        return {
            success: true,
            data: {
                topic,
                posts,
                pagination: {
                    total,
                    page,
                    pageSize,
                    totalPages: Math.ceil(total / pageSize)
                }
            }
        }
    } catch (error) {
        console.error('获取主题详情失败:', error)
        return {
            success: false,
            message: '获取主题详情失败'
        }
    }
}) 