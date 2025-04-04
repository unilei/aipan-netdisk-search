import prisma from "~/lib/prisma"

export default defineEventHandler(async (event) => {
    try {
        // 检查用户是否已登录并有管理权限
        const user = event.context.user
        if (!user || !user.userId) {
            throw createError({
                statusCode: 401,
                statusMessage: "Unauthorized",
                message: "请先登录"
            })
        }

        // 检查是否有管理员或版主权限
        if (user.role !== 'ADMIN' && user.role !== 'MODERATOR') {
            throw createError({
                statusCode: 403,
                statusMessage: "Forbidden",
                message: "您没有权限执行此操作"
            })
        }

        const { slug } = getRouterParams(event)

        if (!slug) {
            return {
                success: false,
                message: '主题不存在'
            }
        }

        const body = await readBody(event)
        const { isLocked } = body

        // 检查主题是否存在
        const topic = await prisma.forumTopic.findUnique({
            where: { slug: decodeURI(slug) }
        })

        if (!topic) {
            return {
                success: false,
                message: '主题不存在'
            }
        }

        // 更新锁定状态
        const updatedTopic = await prisma.forumTopic.update({
            where: { id: topic.id },
            data: {
                isLocked: isLocked === true || isLocked === 'true'
            }
        })

        return {
            success: true,
            data: updatedTopic
        }
    } catch (error: any) {
        console.error('更新主题锁定状态失败:', error)
        if (error.statusCode) {
            throw error
        }
        return {
            success: false,
            message: '更新主题锁定状态失败'
        }
    }
}) 