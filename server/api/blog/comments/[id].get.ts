import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
    try {
        const id = event.context.params?.id
        if (!id) {
            throw new Error('Post ID is required')
        }
        const postId = parseInt(id)

        // 获取评论，包括回复
        const comments = await prisma.comment.findMany({
            where: {
                postId: postId,
                parentId: null // 只获取顶级评论
            },
            include: {
                replies: {
                    include: {
                        replies: true // 支持二级回复
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return {
            code: 200,
            message: 'Success',
            data: comments
        }
    } catch (error) {
        console.error('Error fetching comments:', error)
        return {
            code: 500,
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}) 