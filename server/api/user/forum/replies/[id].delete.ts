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
                        id: true,
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

        // 用户需要是作者或者管理员才能删除
        if (reply.authorId !== user.userId && user.role !== 'admin') {
            throw createError({
                statusCode: 403,
                statusMessage: "Forbidden",
                message: "您无权删除此回复"
            })
        }

        // 检查主题是否已锁定
        if (reply.topic?.isLocked && user.role !== 'admin') {
            return {
                success: false,
                message: '该主题已锁定，无法删除回复'
            }
        }

        // 删除回复
        await prisma.forumPost.delete({
            where: { id }
        })

        return {
            success: true,
            message: '回复已成功删除'
        }
    } catch (error: any) {
        console.error('删除回复失败:', error)
        if (error.statusCode) {
            throw error
        }
        return {
            success: false,
            message: '删除回复失败'
        }
    }
}) 