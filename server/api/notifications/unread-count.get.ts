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

        // 获取未读通知数量
        const userId = user.userId || user.id
        const count = await prisma.notification.count({
            where: {
                userId,
                isRead: false
            }
        })

        return {
            success: true,
            data: {
                count
            }
        }
    } catch (error) {
        console.error('获取未读通知数量失败:', error)
        return {
            success: false,
            message: '获取未读通知数量失败'
        }
    }
})
