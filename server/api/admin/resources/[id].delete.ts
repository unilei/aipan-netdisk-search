import prisma from "~/lib/prisma";
import { removeResource } from "~/server/services/search/elasticsearchClient.js";

export default defineEventHandler(async (event) => {
    const { id } = getRouterParams(event)
    const userId = event.context.user.userId
    const resourceId = Number(id);
    const resource = await prisma.resource.delete({
        where: {
            id: resourceId,
        }
    })

    try {
        await removeResource(resourceId);
    } catch (esError) {
        console.error("从 ES 删除资源失败:", esError);
    }

    return {
        code: 200,
        msg: 'success',
        data: []
    }
})