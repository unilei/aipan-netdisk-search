import prisma from "~/lib/prisma"

export default defineEventHandler(async (event) => {
    try {
        // 检查用户是否已登录
        const user = event.context.user
        if (!user || !user.userId) {
            throw createError({
                statusCode: 401,
                statusMessage: "Unauthorized",
                message: "请先登录"
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

        // 检查主题是否存在且属于当前用户
        const topic = await prisma.forumTopic.findUnique({
            where: { id }
        })

        if (!topic) {
            return {
                success: false,
                message: '主题不存在'
            }
        }

        if (topic.authorId !== user.userId) {
            throw createError({
                statusCode: 403,
                statusMessage: "Forbidden",
                message: "您无权编辑此主题"
            })
        }

        // 获取更新数据
        const body = await readBody(event)
        const { title, content, categoryId } = body

        // 验证数据
        if (!title || !content || !categoryId) {
            return {
                success: false,
                message: '标题、内容和分类不能为空'
            }
        }

        // 对于已批准的主题，编辑后需要重新审核
        const newStatus = topic.status === 'approved' && user.role !== 'admin' ? 'pending' : topic.status

        // 更新主题
        const updatedTopic = await prisma.forumTopic.update({
            where: { id },
            data: {
                title,
                content,
                categoryId: parseInt(categoryId),
                status: newStatus,
                updatedAt: new Date()
            }
        })

        return {
            success: true,
            message: newStatus === 'pending' ? '主题已更新，等待审核' : '主题更新成功',
            data: updatedTopic
        }
    } catch (error: any) {
        console.error('更新主题失败:', error)
        if (error.statusCode) {
            throw error
        }
        return {
            success: false,
            message: '更新主题失败'
        }
    }
}) 