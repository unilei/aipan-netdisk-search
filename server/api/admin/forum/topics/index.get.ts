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

        // 获取查询参数
        const query = getQuery(event)
        const page = parseInt(query.page as string) || 1
        const pageSize = parseInt(query.pageSize as string) || 10
        const status = query.status as string || undefined
        const categoryId = query.categoryId ? parseInt(query.categoryId as string) : undefined
        const keyword = query.keyword as string || undefined

        // 构建查询条件
        const where: any = {}

        if (status) {
            where.status = status
        } else {
            where.status = { not: FORUM_TOPIC_TRASHED_STATUS }
        }

        if (categoryId) {
            where.categoryId = categoryId
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
        const topics = await prisma.forumTopic.findMany({
            where,
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        email: true
                    }
                },
                category: true,
                _count: {
                    select: { posts: true }
                }
            },
            orderBy: [
                { isSticky: 'desc' },
                { createdAt: 'desc' }
            ],
            skip: (page - 1) * pageSize,
            take: pageSize
        })

        return {
            success: true,
            data: {
                topics,
                pagination: {
                    page,
                    pageSize,
                    total,
                    totalPages: Math.ceil(total / pageSize)
                }
            }
        }
    } catch (error) {
        console.error('获取主题列表失败:', error)
        return {
            success: false,
            message: '获取主题列表失败'
        }
    }
})
