import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
    const { id } = getRouterParams(event)
    const userId = event.context.user.userId
    try {
        const postCategory = await prisma.postCategory.delete({
            where: {
                id: Number(id),
            }
        })
        return {
            code: 200,
            msg: 'success',
            data: []
        }
    } catch (e) {
        return {
            code: 500,
            msg: 'error',
            data: e
        }
    }

})