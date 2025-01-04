import prisma from "~/lib/prisma";
export default defineEventHandler(async (event) => {
    const { id } = getRouterParams(event);

    const userId = event.context.user.userId;
    const { title, content, categoryIds, tags } = await readBody(event);
    if (!title || !content || !userId || !categoryIds || !tags) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Title, content, creatorId, categoryIds, and tags are required'
        })
    }
    
    const currentPost = await prisma.blogPost.findUnique({
        where: {
            id: Number(id),
        }
    })

    if (!currentPost) {
        throw createError({ statusCode: 404, statusMessage: 'Resource not found' });
    }
    if (currentPost.authorId !== userId) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' }); // 仅允许资源的创建者更新资源
    }

    try {
        const updatedPost = await prisma.blogPost.update({
            where: { id: Number(id) },
            data: {
                title: title,
                content: content,
                tags: tags,
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