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

        // 月份筛选参数
        const year = parseInt(query.year as string) || new Date().getFullYear()
        const month = parseInt(query.month as string) || new Date().getMonth() + 1

        // 构建日期范围
        const startDate = new Date(year, month - 1, 1) // 月份从0开始
        const endDate = new Date(year, month, 0) // 获取该月的最后一天
        endDate.setHours(23, 59, 59, 999)

        // 获取签到记录
        const checkIns = await prisma.checkIn.findMany({
            where: {
                userId: userId,
                checkInDate: {
                    gte: startDate,
                    lte: endDate
                }
            },
            orderBy: {
                checkInDate: 'desc'
            },
            skip: skip,
            take: limit
        })

        // 获取总记录数
        const total = await prisma.checkIn.count({
            where: {
                userId: userId,
                checkInDate: {
                    gte: startDate,
                    lte: endDate
                }
            }
        })

        // 获取本月统计信息
        const monthStats = await getMonthStats(userId, year, month)

        return {
            code: 200,
            msg: 'success',
            data: {
                checkIns: checkIns,
                pagination: {
                    page: page,
                    limit: limit,
                    total: total,
                    totalPages: Math.ceil(total / limit)
                },
                monthStats: monthStats
            }
        }

    } catch (error: any) {
        console.error('获取签到历史失败:', error)
        throw createError({
            statusCode: error.statusCode || 500,
            message: error.message || '获取签到历史失败'
        })
    }
})

// 获取月度统计信息
async function getMonthStats(userId: number, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)
    endDate.setHours(23, 59, 59, 999)

    // 本月签到次数
    const monthlyCheckInCount = await prisma.checkIn.count({
        where: {
            userId: userId,
            checkInDate: {
                gte: startDate,
                lte: endDate
            }
        }
    })

    // 本月获得的积分
    const monthlyPoints = await prisma.checkIn.aggregate({
        where: {
            userId: userId,
            checkInDate: {
                gte: startDate,
                lte: endDate
            }
        },
        _sum: {
            points: true
        }
    })

    // 本月最长连续签到天数
    const monthlyCheckIns = await prisma.checkIn.findMany({
        where: {
            userId: userId,
            checkInDate: {
                gte: startDate,
                lte: endDate
            }
        },
        orderBy: {
            checkInDate: 'asc'
        }
    })

    let maxConsecutive = 0
    let currentConsecutive = 0
    let lastDate: Date | null = null

    for (const checkIn of monthlyCheckIns) {
        const currentDate = new Date(checkIn.checkInDate)
        
        if (lastDate) {
            const diffTime = currentDate.getTime() - lastDate.getTime()
            const diffDays = diffTime / (1000 * 60 * 60 * 24)
            
            if (diffDays === 1) {
                currentConsecutive++
            } else {
                maxConsecutive = Math.max(maxConsecutive, currentConsecutive)
                currentConsecutive = 1
            }
        } else {
            currentConsecutive = 1
        }
        
        lastDate = currentDate
    }
    maxConsecutive = Math.max(maxConsecutive, currentConsecutive)

    // 本月应签到天数（到今天为止）
    const today = new Date()
    const daysInMonth = endDate.getDate()
    const currentDay = today.getMonth() === month - 1 && today.getFullYear() === year 
        ? today.getDate() 
        : daysInMonth

    return {
        year: year,
        month: month,
        checkInCount: monthlyCheckInCount,
        totalPoints: monthlyPoints._sum.points || 0,
        maxConsecutiveDays: maxConsecutive,
        checkInRate: Math.round((monthlyCheckInCount / currentDay) * 100),
        daysInMonth: daysInMonth,
        currentDay: currentDay
    }
}
