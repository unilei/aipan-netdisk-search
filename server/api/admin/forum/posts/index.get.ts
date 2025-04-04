import prisma from "~/lib/prisma"

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
        const topicId = query.topicId ? parseInt(query.topicId as string) : undefined
        const keyword = query.keyword as string || undefined

        // 构建查询条件
        const where: any = {}

        if (status) {
            where.status = status
        }

        if (topicId) {
            where.topicId = topicId
        }

        if (keyword) {
            where.content = {
                contains: keyword
            }
        }

        // 查询回复总数
        const total = await prisma.forumPost.count({ where })

        // 查询回复列表
        const posts = await prisma.forumPost.findMany({
            where,
            include: {
                author: {
                    select: {
                        id: true,
                        username: true
                    }
                },
                topic: {
                    select: {
                        id: true,
                        title: true,
                        slug: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip: (page - 1) * pageSize,
            take: pageSize
        })

        return {
            success: true,
            data: {
                posts,
                pagination: {
                    page,
                    pageSize,
                    total,
                    totalPages: Math.ceil(total / pageSize)
                }
            }
        }
    } catch (error) {
        console.error('获取回复列表失败:', error)
        return {
            success: false,
            message: '获取回复列表失败'
        }
    }
}) 