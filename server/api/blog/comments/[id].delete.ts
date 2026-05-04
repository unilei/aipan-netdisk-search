import { verifyToken } from '~/server/model/user'
import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
    try {
        const id = event.context.params?.id
        if (!id) {
            return {
                code: 400,
                message: 'Missing comment ID',
                error: 'Comment ID is required'
            }
        }

        // 检查是否是管理员
        const token = getHeader(event, 'authorization')?.split(' ')[1]
        const user = token ? verifyToken(token) : null
        const isAdmin = user?.userId != null // 如果能解析出 userId，说明是管理员

        // 获取请求体中的删除token
        const body = await readBody(event)

        // 如果不是管理员，则需要验证删除token
        if (!isAdmin) {
            if (!body || !body.deleteToken) {
                return {
                    code: 403,
                    message: 'Unauthorized',
                    error: 'Delete token is required'
                }
            }

            // 检查评论是否存在并验证删除token
            const comment = await prisma.comment.findUnique({
                where: { id: parseInt(id) },
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
                    { id: parseInt(id) },
                    { parentId: parseInt(id) }
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
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}) 