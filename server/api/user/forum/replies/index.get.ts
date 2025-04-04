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

        // 获取查询参数
        const query = getQuery(event)
        const page = parseInt(query.page as string) || 1
        const pageSize = parseInt(query.pageSize as string) || 10
        const status = query.status as string || undefined
        const keyword = query.keyword as string || undefined

        // 构建查询条件
        const where: any = {
            authorId: user.userId // 只查询当前用户的回复
        }

        if (status) {
            where.status = status
        }

        if (keyword) {
            where.content = { contains: keyword }
        }

        // 查询回复总数
        const total = await prisma.forumPost.count({ where })

        // 查询回复列表
        const replies = await prisma.forumPost.findMany({
            where,
            include: {
                topic: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        status: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize
        })

        return {
            success: true,
            data: {
                replies,
                pagination: {
                    total,
                    page,
                    pageSize,
                    totalPages: Math.ceil(total / pageSize)
                }
            }
        }
    } catch (error: any) {
        console.error('获取用户回复列表失败:', error)
        if (error.statusCode) {
            throw error
        }
        return {
            success: false,
            message: '获取用户回复列表失败'
        }
    }
}) 