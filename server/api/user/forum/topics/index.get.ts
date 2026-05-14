import prisma from "~/lib/prisma"
import { attachViewerStatesToTopics } from "~/server/services/forum/readStates.mjs";
import { FORUM_TOPIC_TRASHED_STATUS } from "~/server/services/forum/topicTrash.mjs";

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

        // 获取查询参数
        const query = getQuery(event)
        const page = parseInt(query.page as string) || 1
        const pageSize = parseInt(query.pageSize as string) || 10
        const status = query.status as string || undefined
        const keyword = query.keyword as string || undefined
        const userVisibleStatuses = new Set(["pending", "approved", "rejected"])

        // 构建查询条件
        const where: any = {
            authorId: user.userId // 只查询当前用户的主题
        }

        if (status && userVisibleStatuses.has(status)) {
            where.status = status
        } else {
            where.status = { not: FORUM_TOPIC_TRASHED_STATUS }
        }

        if (keyword) {
            where.OR = [
                { title: { contains: keyword } },
                { content: { contains: keyword } }
            ]
        }

        // 查询主题总数
        const total = await prisma.forumTopic.count({ where })

        // 查询主题列表
        const rawTopics = await prisma.forumTopic.findMany({
            where,
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        slug: true
                    }
                },
                _count: {
                    select: { posts: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize
        })
        const topics = await attachViewerStatesToTopics(rawTopics, user.userId, prisma)

        return {
            success: true,
            data: {
                topics,
                pagination: {
                    total,
                    page,
                    pageSize,
                    totalPages: Math.ceil(total / pageSize)
                }
            }
        }
    } catch (error: any) {
        console.error('获取用户主题列表失败:', error)
        if (error.statusCode) {
            throw error
        }
        return {
            success: false,
            message: '获取用户主题列表失败'
        }
    }
})
