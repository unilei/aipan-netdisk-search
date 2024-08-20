import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
    const { name, links, typeId } = await readBody(event)

    const userId = event.context.user.userId;
    const resource = await prisma.resource.create({
        data: {
            name,
            links,
            typeId,
            creatorId: userId
        }
    })

    return {
        code: 200,
        msg: 'success',
        data: resource
    }

})