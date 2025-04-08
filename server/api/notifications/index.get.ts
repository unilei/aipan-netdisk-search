import prisma from "~/lib/prisma"

export default defineEventHandler(async (event) => {
    try {
        const user = event.context.user
        if (!user) {
            throw createError({
                statusCode: 401,
                message: '未登录'
            })
        }

        const query = getQuery(event)
        const page = query.page ? parseInt(query.page as string) : 1
        const pageSize = query.pageSize ? parseInt(query.pageSize as string) : 20
        const isRead = query.isRead ? query.isRead === 'true' : undefined

        // 构建查询条件
        const where = {
            userId: user.id,
            ...(isRead !== undefined ? { isRead } : {})
        }

        // 获取总数
        const total = await prisma.notification.count({ where })

        // 获取通知列表
        const notifications = await prisma.notification.findMany({
            where,
            orderBy: {
                createdAt: 'desc'
            },
            skip: (page - 1) * pageSize,
            take: pageSize,
        })

        return {
            success: true,
            data: {
                notifications,
                pagination: {
                    total,
                    page,
                    pageSize,
                    totalPages: Math.ceil(total / pageSize)
                }
            }
        }
    } catch (error) {
        console.error('获取通知列表失败:', error)
        return {
            success: false,
            message: '获取通知列表失败'
        }
    }
}) 