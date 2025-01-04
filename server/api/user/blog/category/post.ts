import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
    const { name } = await readBody(event)
    const userId = event.context.user.userId
    try {
        const isExists = await prisma.BlogCategory.findUnique({
            where: {
                name
            }
        })
        if (isExists) {
            // throw createError({ statusCode: 400, statusMessage: '资源类型已存在' });
            return {
                code: 200,
                msg: '资源类型已存在',
                data: isExists
            }
        }
        const category = await prisma.BlogCategory.create({
            data: {
                name,

            }
        })
        return {
            code: 200,
            msg: 'success',
            data: category
        }
    } catch (e) {
        return {
            code: 500,
            msg: 'error',
            data: e
        }
    }

})