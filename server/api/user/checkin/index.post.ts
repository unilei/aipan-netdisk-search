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

        if (todayCheckIn) {
            return {
                code: 400,
                msg: '今天已经签到过了',
                data: null
            }
        }

        // 获取昨天的签到记录来计算连续签到天数
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        const yesterdayCheckIn = await prisma.checkIn.findUnique({
            where: {
                userId_checkInDate: {
                    userId: userId,
                    checkInDate: yesterday
                }
            }
        })

        // 计算连续签到天数
        let consecutiveDays = 1
        if (yesterdayCheckIn) {
            consecutiveDays = yesterdayCheckIn.consecutiveDays + 1
        }

        // 计算签到奖励积分
        let points = 10 // 基础签到积分
        let bonusPoints = 0
        let bonusDescription = ''

        // 连续签到奖励
        if (consecutiveDays >= 30) {
            bonusPoints = 50
            bonusDescription = '连续签到30天奖励'
        } else if (consecutiveDays >= 15) {
            bonusPoints = 30
            bonusDescription = '连续签到15天奖励'
        } else if (consecutiveDays >= 7) {
            bonusPoints = 15
            bonusDescription = '连续签到7天奖励'
        } else if (consecutiveDays >= 3) {
            bonusPoints = 5
            bonusDescription = '连续签到3天奖励'
        }

        const totalPoints = points + bonusPoints

        // 使用事务确保数据一致性
        const result = await prisma.$transaction(async (tx) => {
            // 创建签到记录
            const checkIn = await tx.checkIn.create({
                data: {
                    userId: userId,
                    checkInDate: today,
                    points: totalPoints,
                    consecutiveDays: consecutiveDays
                }
            })

            // 更新用户积分
            await tx.user.update({
                where: { id: userId },
                data: {
                    points: {
                        increment: totalPoints
                    }
                }
            })

            // 记录积分历史 - 基础签到积分
            await tx.pointsHistory.create({
                data: {
                    userId: userId,
                    points: points,
                    type: 'checkin',
                    description: '每日签到奖励',
                    relatedId: checkIn.id
                }
            })

            // 记录积分历史 - 连续签到奖励（如果有）
            if (bonusPoints > 0) {
                await tx.pointsHistory.create({
                    data: {
                        userId: userId,
                        points: bonusPoints,
                        type: 'bonus',
                        description: bonusDescription,
                        relatedId: checkIn.id
                    }
                })
            }

            return checkIn
        })

        // 获取用户最新积分
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { points: true }
        })

        return {
            code: 200,
            msg: '签到成功',
            data: {
                checkIn: result,
                totalPoints: user?.points || 0,
                earnedPoints: totalPoints,
                consecutiveDays: consecutiveDays,
                bonusPoints: bonusPoints,
                bonusDescription: bonusDescription
            }
        }

    } catch (error: any) {
        console.error('签到失败:', error)
        throw createError({
            statusCode: error.statusCode || 500,
            message: error.message || '签到失败'
        })
    }
})
