import prisma from "~/lib/prisma";
import {
    getAlistSourceSelect,
    normalizeAlistSourceInput,
    toAdminAlistSource,
} from "~/server/services/alist/records";

export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    const userId = event.context.user.userId;
    const alist = await prisma.alist.create({
        data: {
            ...normalizeAlistSourceInput(body),
            creatorId: userId
        },
        select: getAlistSourceSelect(),
    })

    return {
        code: 200,
        msg: 'success',
        data: toAdminAlistSource(alist)
    }

})
