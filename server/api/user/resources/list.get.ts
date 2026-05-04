import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
    // 确保用户已登录
    if (!event.context.user?.userId) {
        throw createError({
            statusCode: 401,
            message: '请先登录'
        })
    }

    const userId = event.context.user.userId;
    const query = getQuery(event)
    const page = Number(query.page) || 1
    const pageSize = Number(query.pageSize) || 10
    
    try {
        const [resources, total] = await Promise.all([
            prisma.userResource.findMany({
                where: {
                    creatorId: userId
                },
                include: {
                    type: true,
                    creator: {
                        select: {
                            id: true,
                            username: true,
                            email: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                skip: (page - 1) * pageSize,
                take: pageSize
            }),
            prisma.userResource.count({
                where: {
                    creatorId: userId
                }
            })
        ])

        return {
            code: 200,
            msg: 'success',
            data: {
                resources,
                pagination: {
                    total,
                    page,
                    pageSize,
                    totalPages: Math.ceil(total / pageSize)
                }
            }
        }
    } catch (error) {
        console.error('获取资源列表失败:', error)
        throw createError({
            statusCode: 500,
            message: '获取资源列表失败'
        })
    }
}) 