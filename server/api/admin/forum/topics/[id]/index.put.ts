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

        // 获取更新数据
        const body = await readBody(event)
        const { title, content, categoryId, status, isSticky, isLocked } = body

        // 验证数据
        if (!title || !content || !categoryId) {
            return {
                success: false,
                message: '标题、内容和分类不能为空'
            }
        }

        // 更新主题
        const updatedTopic = await prisma.forumTopic.update({
            where: { id },
            data: {
                title,
                content,
                categoryId: parseInt(categoryId),
                status: status || topic.status,
                isSticky: isSticky !== undefined ? isSticky : topic.isSticky,
                isLocked: isLocked !== undefined ? isLocked : topic.isLocked,
                updatedAt: new Date()
            }
        })

        return {
            success: true,
            message: '主题更新成功',
            data: updatedTopic
        }
    } catch (error) {
        console.error('更新主题失败:', error)
        return {
            success: false,
            message: '更新主题失败'
        }
    }
}) 