import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
    const { name, link } = await readBody(event)

    const userId = event.context.user.userId;
    const alist = await prisma.alist.create({
        data: {
            name,
            link,
            creatorId: userId
        }
    })

    return {
        code: 200,
        msg: 'success',
        data: alist
    }

})