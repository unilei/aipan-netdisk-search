import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
    try {
        // 确保用户已登录
        if (!event.context.user?.userId) {
            throw createError({
                statusCode: 401,
                message: '请先登录'
            })
        }

        const userId = event.context.user.userId
        const query = getQuery(event)
        
        // 分页参数
        const page = parseInt(query.page as string) || 1
        const limit = parseInt(query.limit as string) || 20
        const skip = (page - 1) * limit

        // 筛选参数
        const type = query.type as string // 积分类型筛选
        const startDate = query.startDate ? new Date(query.startDate as string) : undefined
        const endDate = query.endDate ? new Date(query.endDate as string) : undefined

        // 构建查询条件
        const whereCondition: any = {
            userId: userId
        }

        if (type) {
            whereCondition.type = type
        }

        if (startDate || endDate) {
            whereCondition.createdAt = {}
            if (startDate) {
                whereCondition.createdAt.gte = startDate
            }
            if (endDate) {
                const end = new Date(endDate)
                end.setHours(23, 59, 59, 999)
                whereCondition.createdAt.lte = end
            }
        }

        // 获取积分历史记录
        const pointsHistory = await prisma.pointsHistory.findMany({
            where: whereCondition,
            orderBy: {
                createdAt: 'desc'
            },
            skip: skip,
            take: limit
        })

        // 获取总记录数
        const total = await prisma.pointsHistory.count({
            where: whereCondition
        })

        // 获取筛选条件下的积分统计
        const stats = await getFilteredStats(userId, whereCondition)

        return {
            code: 200,
            msg: 'success',
            data: {
                history: pointsHistory,
                pagination: {
                    page: page,
                    limit: limit,
                    total: total,
                    totalPages: Math.ceil(total / limit)
                },
                stats: stats,
                filters: {
                    type: type,
                    startDate: startDate,
                    endDate: endDate
                }
            }
        }

    } catch (error: any) {
        console.error('获取积分历史失败:', error)
        throw createError({
            statusCode: error.statusCode || 500,
            message: error.message || '获取积分历史失败'
        })
    }
})

// 获取筛选条件下的统计信息
async function getFilteredStats(userId: number, whereCondition: any) {
    // 总获得积分
    const totalEarned = await prisma.pointsHistory.aggregate({
        where: {
            ...whereCondition,
            points: {
                gt: 0
            }
        },
        _sum: {
            points: true
        }
    })

    // 总消费积分
    const totalSpent = await prisma.pointsHistory.aggregate({
        where: {
            ...whereCondition,
            points: {
                lt: 0
            }
        },
        _sum: {
            points: true
        }
    })

    // 记录数量
    const recordCount = await prisma.pointsHistory.count({
        where: whereCondition
    })

    // 按类型分组统计
    const typeStats = await prisma.pointsHistory.groupBy({
        by: ['type'],
        where: whereCondition,
        _sum: {
            points: true
        },
        _count: {
            _all: true
        }
    })

    return {
        totalEarned: totalEarned._sum.points || 0,
        totalSpent: Math.abs(totalSpent._sum.points || 0),
        recordCount: recordCount,
        typeStats: typeStats.map(stat => ({
            type: stat.type,
            points: stat._sum.points || 0,
            count: stat._count._all,
            typeName: getTypeName(stat.type)
        }))
    }
}

// 获取积分类型的中文名称
function getTypeName(type: string): string {
    const typeNames: { [key: string]: string } = {
        'checkin': '每日签到',
        'bonus': '连续签到奖励',
        'consume': '积分消费',
        'admin': '管理员调整',
        'activity': '活动奖励',
        'task': '任务奖励'
    }
    return typeNames[type] || type
}
