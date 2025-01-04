import prisma from "~/lib/prisma";
export default defineEventHandler(async (event) => {
    const { id } = getRouterParams(event)
    try {
        const currentPost = await prisma.blogPost.findUnique({
            where: {
                id: Number(id),
            },
            include: {
                author: {
                    select: { username: true }, // 包含作者的用户名
                },
                categories: {
                    include: { category: true }
                },
            },
        })
        return {
            code: 200,
            msg: 'success',
            data: currentPost
        }
    } catch (e) {
        return {
            code: 500,
            msg: 'error',
            data: e
        }
    }
})