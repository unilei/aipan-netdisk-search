import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
    const { id } = getRouterParams(event)
    const userId = event.context.user.userId
    const postId = Number(id)

    if (!Number.isInteger(postId) || postId <= 0) {
        throw createError({
            statusCode: 400,
            statusMessage: '无效的文章 ID'
        })
    }

    try {
        const ownedPost = await prisma.blogPost.findFirst({
            where: {
                id: postId,
                authorId: userId
            },
            select: {
                id: true
            }
        })

        if (!ownedPost) {
            throw createError({
                statusCode: 404,
                statusMessage: '文章不存在'
            })
        }

        await prisma.blogPost.delete({
            where: { id: ownedPost.id }
        })

        return {
            code: 200,
            msg: 'success',
            data: null
        }
    } catch (error: any) {
        if (error.statusCode) {
            throw error
        }

        console.error('删除博客文章失败:', error)
        throw createError({
            statusCode: 500,
            statusMessage: '删除文章失败'
        })
    }
})
