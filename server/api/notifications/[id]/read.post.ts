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

        const id = parseInt(event.context.params?.id as string)
        if (!id) {
            throw createError({
                statusCode: 400,
                message: '无效的通知ID'
            })
        }

        const userId = user.userId || user.id
        const existingNotification = await prisma.notification.findFirst({
            where: {
                id,
                userId
            }
        })

        if (!existingNotification) {
            throw createError({
                statusCode: 404,
                message: '通知不存在'
            })
        }

        // 更新通知状态
        const notification = await prisma.notification.update({
            where: {
                id
            },
            data: {
                isRead: true
            }
        })

        return {
            success: true,
            data: notification
        }
    } catch (error) {
        console.error('标记通知为已读失败:', error)
        return {
            success: false,
            message: '标记通知为已读失败'
        }
    }
})
