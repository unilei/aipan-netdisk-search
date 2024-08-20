import prisma from "~/lib/prisma";
export default defineEventHandler(async (event) => {
    const { id } = getRouterParams(event)
    const resource = await prisma.resource.findUnique({
        where: {
            id: Number(id),
        }
    })
    return {
        code: 200,
        msg: 'success',
        data: resource
    }
})