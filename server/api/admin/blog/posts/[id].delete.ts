import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
    const { id } = getRouterParams(event)
    const userId = event.context.user.userId

    try {
        const deletedPost = await prisma.post.delete({
            where: { id: Number(id) }
        })

        return {
            code: 200,
            msg: 'success',
            data: deletedPost
        }
    } catch (error) {
        return error;
        // return { error: 'Unable to delete post' }
    }

})