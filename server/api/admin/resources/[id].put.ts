import prisma from "~/lib/prisma";
export default defineEventHandler(async (event) => {
    const { id } = getRouterParams(event);
    const userId = event.context.user.userId;
    const { name, links, typeId } = await readBody(event);
    const resource = await prisma.resource.findUnique({
        where: {
            id: Number(id),
        }
    })
    if (!resource) {
        throw createError({ statusCode: 404, statusMessage: 'Resource not found' });
    }
    if (resource.creatorId !== userId) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' }); // 仅允许资源的创建者更新资源
    }

    const updatedResource = await prisma.resource.update({
        where: { id: Number(id) },
        data: {
            name,
            links,
            typeId,
        },
    });

    return {
        code: 200,
        msg: 'success',
        data: updatedResource
    };
})