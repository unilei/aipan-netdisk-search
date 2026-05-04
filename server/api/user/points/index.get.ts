import prisma from "~/lib/prisma";
import {
    decoratePointsHistory,
    getUserPointsBreakdown,
} from "~/server/services/points/userPoints";
import {
    DEFAULT_ACCESS_DURATION,
    DEFAULT_API_URL,
    DEFAULT_QUARK_CONFIG,
    getTransferTaskFromQuarkConfig,
    normalizeQuarkConfig,
} from "~/server/services/quark/quarkConfig.mjs";

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

        // 获取用户当前积分
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { 
                points: true,
                createdAt: true
            }
        })

        if (!user) {
            throw createError({
                statusCode: 404,
                message: '用户不存在'
            })
        }

        const pointsBreakdown = await getUserPointsBreakdown(userId, {
            permanentPoints: user.points
        })

        // 获取积分统计信息
        const pointsStats = await getPointsStats(userId, pointsBreakdown)

        // 获取最近的积分历史
        const recentHistory = await prisma.pointsHistory.findMany({
            where: {
                userId: userId
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 10
        })
        const transferTask = await getTransferTaskConfig()

        return {
            code: 200,
            msg: 'success',
            data: {
                currentPoints: pointsBreakdown.effectivePoints,
                permanentPoints: pointsBreakdown.permanentPoints,
                temporaryPoints: pointsBreakdown.temporaryPoints,
                effectivePoints: pointsBreakdown.effectivePoints,
                nextExpiringAt: pointsBreakdown.nextExpiringAt,
                breakdown: pointsBreakdown,
                userSince: user.createdAt,
                stats: pointsStats,
                recentHistory: decoratePointsHistory(recentHistory),
                transferTask
            }
        }

    } catch (error: any) {
        console.error('获取积分信息失败:', error)
        throw createError({
            statusCode: error.statusCode || 500,
            message: error.message || '获取积分信息失败'
        })
    }
})

// 获取积分统计信息
async function getPointsStats(userId: number, pointsBreakdown: any) {
    // 总获得积分
    const totalEarned = await prisma.pointsHistory.aggregate({
        where: {
            userId: userId,
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
            userId: userId,
            points: {
                lt: 0
            }
        },
        _sum: {
            points: true
        }
    })

    // 本月获得积分
    const currentMonth = new Date()
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
    monthEnd.setHours(23, 59, 59, 999)

    const monthlyEarned = await prisma.pointsHistory.aggregate({
        where: {
            userId: userId,
            points: {
                gt: 0
            },
            createdAt: {
                gte: monthStart,
                lte: monthEnd
            }
        },
        _sum: {
            points: true
        }
    })

    // 今日获得积分
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const dailyEarned = await prisma.pointsHistory.aggregate({
        where: {
            userId: userId,
            points: {
                gt: 0
            },
            createdAt: {
                gte: today,
                lt: tomorrow
            }
        },
        _sum: {
            points: true
        }
    })

    // 按类型统计积分
    const pointsByType = await prisma.pointsHistory.groupBy({
        by: ['type'],
        where: {
            userId: userId
        },
        _sum: {
            points: true
        },
        _count: {
            _all: true
        }
    })

    // 最近7天的积分趋势
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const weeklyTrend = await prisma.pointsHistory.findMany({
        where: {
            userId: userId,
            createdAt: {
                gte: sevenDaysAgo
            }
        },
        orderBy: {
            createdAt: 'asc'
        }
    })

    // 按天分组统计
    const dailyTrend = groupByDay(weeklyTrend)

    return {
        permanentPoints: pointsBreakdown.permanentPoints,
        temporaryPoints: pointsBreakdown.temporaryPoints,
        effectivePoints: pointsBreakdown.effectivePoints,
        nextExpiringAt: pointsBreakdown.nextExpiringAt,
        totalEarned: totalEarned._sum.points || 0,
        totalSpent: Math.abs(totalSpent._sum.points || 0),
        monthlyEarned: monthlyEarned._sum.points || 0,
        dailyEarned: dailyEarned._sum.points || 0,
        pointsByType: pointsByType,
        weeklyTrend: dailyTrend
    }
}

async function getTransferTaskConfig() {
    const settings = await prisma.systemSettings.findFirst({
        where: {
            key: 'quark_config'
        }
    })
    const storedConfig = settings ? JSON.parse(settings.value || '{}') : {}
    const config = normalizeQuarkConfig({
        ...DEFAULT_QUARK_CONFIG,
        ...storedConfig,
        apiUrl: storedConfig.apiUrl || DEFAULT_API_URL,
        accessDurationMinutes:
            storedConfig.accessDurationMinutes || DEFAULT_ACCESS_DURATION,
    })

    return getTransferTaskFromQuarkConfig(config)
}

// 按天分组积分数据
function groupByDay(history: any[]) {
    const grouped: { [key: string]: number } = {}
    
    // 初始化最近7天的数据
    for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateKey = date.toISOString().split('T')[0]
        if (dateKey) {
            grouped[dateKey] = 0
        }
    }

    // 累加每天的积分
    history.forEach(record => {
        const dateKey = new Date(record.createdAt).toISOString().split('T')[0]
        if (dateKey && grouped.hasOwnProperty(dateKey)) {
            grouped[dateKey] += record.points > 0 ? record.points : 0
        }
    })

    // 转换为数组格式
    return Object.entries(grouped).map(([date, points]) => ({
        date,
        points
    }))
}
