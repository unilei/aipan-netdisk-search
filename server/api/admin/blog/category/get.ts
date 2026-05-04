import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
    try {

        const postCategories = await prisma.postCategory.findMany({
            orderBy: {
                id: 'asc'
            }
        })
        return {
            code: 200,
            msg: 'success',
            data: postCategories
        }

    } catch (e) {
        // console.log(e)
        return {
            code: 500,
            msg: 'error',
        }
    }
})