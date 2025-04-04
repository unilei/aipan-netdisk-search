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

        // 获取回复ID
        const id = parseInt(event.context.params?.id || '')
        if (!id || isNaN(id)) {
            return {
                success: false,
                message: '无效的回复ID'
            }
        }

        // 检查回复是否存在且属于当前用户
        const reply = await prisma.forumPost.findUnique({
            where: { id },
            include: {
                topic: {
                    select: {
                        isLocked: true
                    }
                }
            }
        })

        if (!reply) {
            return {
                success: false,
                message: '回复不存在'
            }
        }

        // 用户需要是作者才能编辑
        if (reply.authorId !== user.userId) {
            throw createError({
                statusCode: 403,
                statusMessage: "Forbidden",
                message: "您无权编辑此回复"
            })
        }

        // 检查主题是否已锁定
        if (reply.topic?.isLocked) {
            return {
                success: false,
                message: '该主题已锁定，无法修改回复'
            }
        }

        // 获取更新数据
        const body = await readBody(event)
        const { content } = body

        // 验证数据
        if (!content) {
            return {
                success: false,
                message: '回复内容不能为空'
            }
        }

        // 对于已批准的回复，编辑后需要重新审核
        const newStatus = reply.status === 'approved' && user.role !== 'admin' ? 'pending' : reply.status

        // 更新回复
        const updatedReply = await prisma.forumPost.update({
            where: { id },
            data: {
                content,
                status: newStatus,
                updatedAt: new Date()
            }
        })

        return {
            success: true,
            message: newStatus === 'pending' ? '回复已更新，等待审核' : '回复更新成功',
            data: updatedReply
        }
    } catch (error: any) {
        console.error('更新回复失败:', error)
        if (error.statusCode) {
            throw error
        }
        return {
            success: false,
            message: '更新回复失败'
        }
    }
}) 