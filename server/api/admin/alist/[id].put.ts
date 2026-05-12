import prisma from "~/lib/prisma";
import {
    getAlistSourceSelect,
    normalizeAlistSourceInput,
    toAdminAlistSource,
} from "~/server/services/alist/records";

export default defineEventHandler(async (event) => {
    const { id } = getRouterParams(event);
    const body = await readBody(event);
    const alist = await prisma.alist.findUnique({
        where: {
            id: Number(id),
        }
    })
    if (!alist) {
        throw createError({ statusCode: 404, statusMessage: 'Alist not found' });
    }

    const updatedAlist = await prisma.alist.update({
        where: { id: Number(id) },
        data: normalizeAlistSourceInput(body, alist),
        select: getAlistSourceSelect(),
    });

    return {
        code: 200,
        msg: 'success',
        data: toAdminAlistSource(updatedAlist)
    };
})
