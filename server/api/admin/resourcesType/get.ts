import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
    try {

        const resourcesType = await prisma.resourceType.findMany({
            orderBy: {
                id: 'asc'
            }
        })
        return {
            code: 200,
            msg: 'success',
            data: resourcesType
        }

    } catch (e) {
        // console.log(e)
        return {
            code: 500,
            msg: 'error',
        }
    }
})