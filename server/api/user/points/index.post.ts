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
        const { points, type, description } = await readBody(event)

        // 验证输入
        if (!points || !type) {
            throw createError({
                statusCode: 400,
                message: '积分数量和类型为必填项'
            })
        }

        // 只允许管理员进行积分调整
        if (event.context.user.role !== 'admin') {
            throw createError({
                statusCode: 403,
                message: '权限不足'
            })
        }

        // 使用事务确保数据一致性
        const result = await prisma.$transaction(async (tx) => {
            // 更新用户积分
            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: {
                    points: {
                        increment: points
                    }
                },
                select: {
                    points: true
                }
            })

            // 记录积分历史
            const pointsRecord = await tx.pointsHistory.create({
                data: {
                    userId: userId,
                    points: points,
                    type: type,
                    description: description || '管理员调整'
                }
            })

            return {
                pointsRecord,
                newTotal: updatedUser.points
            }
        })

        return {
            code: 200,
            msg: '积分调整成功',
            data: result
        }

    } catch (error: any) {
        console.error('积分调整失败:', error)
        throw createError({
            statusCode: error.statusCode || 500,
            message: error.message || '积分调整失败'
        })
    }
})
