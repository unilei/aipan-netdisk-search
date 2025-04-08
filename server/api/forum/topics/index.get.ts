import prisma from '~/lib/prisma'

export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event)
        const categoryId = query.categoryId ? parseInt(query.categoryId as string) : undefined
        const page = query.page ? parseInt(query.page as string) : 1
        const pageSize = query.pageSize ? parseInt(query.pageSize as string) : 20

        // 构建查询条件，添加状态过滤，只显示已批准的主题
        const where = {
            ...(categoryId ? { categoryId } : {}),
            status: 'approved'  // 只返回已批准的主题
        }

        // 获取总数
        const total = await prisma.forumTopic.count({ where })

        // 按条件查询
        const topics = await prisma.forumTopic.findMany({
            where,
            orderBy: [
                { isSticky: 'desc' },
                { createdAt: 'desc' },
                { lastActivityAt: 'desc' }
            ],
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        avatarStyle: true,
                    }
                },
                category: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    }
                },
                _count: {
                    select: {
                        posts: true
                    }
                }
            },
            skip: (page - 1) * pageSize,
            take: pageSize,
        })

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
    } catch (error) {
        console.error('获取论坛主题列表失败:', error)
        return {
            success: false,
            message: '获取论坛主题列表失败'
        }
    }
}) 