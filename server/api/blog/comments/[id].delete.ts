import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
    try {
        const id = event.context.params?.id
        const commentId = Number(id)
        if (!Number.isInteger(commentId) || commentId <= 0) {
            return {
                code: 400,
                message: 'Missing comment ID',
                error: 'Comment ID is required'
            }
        }

        // 管理员身份由全局认证中间件按数据库当前角色写入上下文。
        const isAdmin = event.context.user?.role === 'admin'

        // 如果不是管理员，则需要验证删除token
        if (!isAdmin) {
            const body = await readBody(event)
            if (!body || !body.deleteToken) {
                return {
                    code: 403,
                    message: 'Unauthorized',
                    error: 'Delete token is required'
                }
            }

            // 检查评论是否存在并验证删除token
            const comment = await prisma.comment.findUnique({
                where: { id: commentId },
                select: { id: true, deleteToken: true }
            })

            if (!comment) {
                return {
                    code: 404,
                    message: 'Comment not found',
                    error: 'The specified comment does not exist'
                }
            }

            // 验证删除token
            if (comment.deleteToken !== body.deleteToken) {
                return {
                    code: 403,
                    message: 'Unauthorized',
                    error: 'Invalid delete token'
                }
            }
        }

        // 删除评论及其所有回复
        await prisma.comment.deleteMany({
            where: {
                OR: [
                    { id: commentId },
                    { parentId: commentId }
                ]
            }
        })

        return {
            code: 200,
            message: 'Comment deleted successfully'
        }
    } catch (error) {
        console.error('Error deleting comment:', error)
        return {
            code: 500,
            message: 'Internal server error',
            error: 'Comment deletion failed'
        }
    }
})
