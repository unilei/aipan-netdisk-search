import prisma from "~/lib/prisma";
import {
    getAlistSourceSelect,
    toAdminAlistSource,
} from "~/server/services/alist/records";

export default defineEventHandler(async (event) => {
    const { id } = getRouterParams(event)
    const alist = await prisma.alist.findUnique({
        where: {
            id: Number(id),
        },
        select: getAlistSourceSelect(),
    })
    return {
        code: 200,
        msg: 'success',
        data: alist ? toAdminAlistSource(alist) : null
    }
})
