import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
    const { name } = await readBody(event)
    const userId = event.context.user.userId
    try {
        const resourceExists = await prisma.resourceType.findUnique({
            where: {
                name
            }
        })
        if (resourceExists) {
            // throw createError({ statusCode: 400, statusMessage: '资源类型已存在' });
            return {
                code: 200,
                msg: '资源类型已存在',
                data: resourceExists
            }
        }
        const resource = await prisma.resourceType.create({
            data: {
                name,
                creatorId: userId
            }
        })
        return {
            code: 200,
            msg: 'success',
            data: resource
        }
    } catch (e) {
        return {
            code: 500,
            msg: 'error',
            data: e
        }
    }

})