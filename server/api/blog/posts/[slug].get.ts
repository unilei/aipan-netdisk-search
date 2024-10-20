import prisma from "~/lib/prisma";
export default defineEventHandler(async (event) => {
    const { slug } = getRouterParams(event)
    // console.log(decodeURI(slug))
    try {
        const currentPost = await prisma.post.findUnique({
            where: {
                slug: decodeURI(slug),
            },
            include: {
                creator: {
                    select: { username: true }, // 包含创建者的用户名
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