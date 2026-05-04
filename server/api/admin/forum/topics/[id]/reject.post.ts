import prisma from "~/lib/prisma"

export default defineEventHandler(async (event) => {
    try {
        // 权限验证
        const user = event.context.user
        if (!user || user.role !== "admin") {
            throw createError({
                statusCode: 403,
                statusMessage: "Forbidden",
                message: "需要管理员权限"
            })
        }

        // 获取主题ID
        const id = parseInt(event.context.params?.id || '')
        if (!id || isNaN(id)) {
            return {
                success: false,
                message: '无效的主题ID'
            }
        }

        // 检查主题是否存在
        const topic = await prisma.forumTopic.findUnique({
            where: { id }
        })

        if (!topic) {
            return {
                success: false,
                message: '主题不存在'
            }
        }

        // 更新主题状态为已拒绝
        const updatedTopic = await prisma.forumTopic.update({
            where: { id },
            data: { status: 'rejected' }
        })

        return {
            success: true,
            message: '主题已拒绝',
            data: updatedTopic
        }
    } catch (error) {
        console.error('拒绝主题失败:', error)
        return {
            success: false,
            message: '拒绝主题失败'
        }
    }
}) 