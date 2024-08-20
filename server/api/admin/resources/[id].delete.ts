import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
    const { id } = getRouterParams(event)
    const userId = event.context.user.userId
    const resource = await prisma.resource.delete({
        where: {
            id: Number(id),
        }
    })
    return {
        code: 200,
        msg: 'success',
        data: []
    }
})