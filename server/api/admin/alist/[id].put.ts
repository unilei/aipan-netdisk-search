import prisma from "~/lib/prisma";
export default defineEventHandler(async (event) => {
    const { id } = getRouterParams(event);
    const userId = event.context.user.userId;
    const { name, link } = await readBody(event);
    const alist = await prisma.alist.findUnique({
        where: {
            id: Number(id),
        }
    })
    if (!alist) {
        throw createError({ statusCode: 404, statusMessage: 'Alist not found' });
    }
    if (alist.creatorId !== userId) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' }); // 仅允许资源的创建者更新资源
    }

    const updatedAlist = await prisma.alist.update({
        where: { id: Number(id) },
        data: {
            name,
            link
        },
    });

    return {
        code: 200,
        msg: 'success',
        data: updatedAlist
    };
})