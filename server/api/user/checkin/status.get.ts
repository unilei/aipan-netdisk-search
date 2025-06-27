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
        const today = new Date()
        today.setHours(0, 0, 0, 0) // 设置为今天的开始时间

        // 检查今天是否已经签到
        const todayCheckIn = await prisma.checkIn.findUnique({
            where: {
                userId_checkInDate: {
                    userId: userId,
                    checkInDate: today
                }
            }
        })

        // 获取最近的签到记录来计算连续签到天数
        const latestCheckIn = await prisma.checkIn.findFirst({
            where: {
                userId: userId
            },
            orderBy: {
                checkInDate: 'desc'
            }
        })

        // 计算当前连续签到天数
        let currentConsecutiveDays = 0
        if (latestCheckIn) {
            const latestDate = new Date(latestCheckIn.checkInDate)
            latestDate.setHours(0, 0, 0, 0)
            
            const yesterday = new Date(today)
            yesterday.setDate(yesterday.getDate() - 1)
            
            // 如果最近签到是今天或昨天，则连续签到未中断
            if (latestDate.getTime() === today.getTime() || latestDate.getTime() === yesterday.getTime()) {
                currentConsecutiveDays = latestCheckIn.consecutiveDays
            }
        }

        // 获取本月签到次数
        const currentMonth = new Date()
        const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
        const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
        monthEnd.setHours(23, 59, 59, 999)

        const monthlyCheckInCount = await prisma.checkIn.count({
            where: {
                userId: userId,
                checkInDate: {
                    gte: monthStart,
                    lte: monthEnd
                }
            }
        })

        // 获取总签到次数
        const totalCheckInCount = await prisma.checkIn.count({
            where: {
                userId: userId
            }
        })

        // 获取用户当前积分
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { points: true }
        })

        return {
            code: 200,
            msg: 'success',
            data: {
                hasCheckedInToday: !!todayCheckIn,
                todayCheckIn: todayCheckIn,
                currentConsecutiveDays: currentConsecutiveDays,
                monthlyCheckInCount: monthlyCheckInCount,
                totalCheckInCount: totalCheckInCount,
                currentPoints: user?.points || 0,
                nextReward: getNextReward(currentConsecutiveDays)
            }
        }

    } catch (error: any) {
        console.error('获取签到状态失败:', error)
        throw createError({
            statusCode: error.statusCode || 500,
            message: error.message || '获取签到状态失败'
        })
    }
})

// 获取下一个奖励信息
function getNextReward(consecutiveDays: number) {
    if (consecutiveDays < 3) {
        return {
            days: 3,
            points: 5,
            description: '连续签到3天可获得额外5积分'
        }
    } else if (consecutiveDays < 7) {
        return {
            days: 7,
            points: 15,
            description: '连续签到7天可获得额外15积分'
        }
    } else if (consecutiveDays < 15) {
        return {
            days: 15,
            points: 30,
            description: '连续签到15天可获得额外30积分'
        }
    } else if (consecutiveDays < 30) {
        return {
            days: 30,
            points: 50,
            description: '连续签到30天可获得额外50积分'
        }
    } else {
        return {
            days: 30,
            points: 50,
            description: '继续保持签到，每30天可获得额外50积分'
        }
    }
}
