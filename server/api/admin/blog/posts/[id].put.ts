import prisma from "~/lib/prisma";
export default defineEventHandler(async (event) => {
    const { id } = getRouterParams(event);

    const userId = event.context.user.userId;
    const { title, content, categoryIds } = await readBody(event);
    if (!title || !content || !userId || !categoryIds) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Title, content, creatorId, and categoryIds are required'
        })
    }
    const currentPost = await prisma.post.findUnique({
        where: {
            id: Number(id),
        }
    })
    if (!currentPost) {
        throw createError({ statusCode: 404, statusMessage: 'Resource not found' });
    }
    if (currentPost.creatorId !== userId) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' }); // 仅允许资源的创建者更新资源
    }

    try {
        const updatedPost = await prisma.post.update({
            where: { id: Number(id) },
            data: {
                title: title,
                content: content,
                categories: {
                    deleteMany: {}, // 删除所有现有关联
                    create: categoryIds.map((id: number) => ({
                        category: { connect: { id } }
                    }))
                }
            }
        })
        return {
            code: 200,
            msg: 'success',
            data: updatedPost
        };
    } catch (error) {
        return { error: 'Unable to update post' }
    }


})