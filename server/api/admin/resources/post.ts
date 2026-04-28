import prisma from "~/lib/prisma";
import { syncResource } from "~/server/services/search/elasticsearchClient.js";
 
export default defineEventHandler(async (event) => {
    const { name, links, typeId } = await readBody(event)
    
    if (!name || !links || !typeId) {
        throw createError({
            statusCode: 400,
            message: '缺少必要参数'
        })
    }

    const userId = event.context.user.userId;
    
    try {
        const resource = await prisma.resource.create({
            data: {
                name,
                links,
                typeId: parseInt(typeId),
                creatorId: userId
            },
            include: {
                creator: { select: { username: true } },
                type: { select: { name: true } },
            }
        })

        try {
            await syncResource(resource);
        } catch (esError) {
            console.error("同步资源到 ES 失败:", esError);
        }

        return {
            code: 200,
            msg: 'success',
            data: resource
        }
    } catch (error) {
        console.error('创建资源失败:', error)
        const errorMessage = error instanceof Error ? error.message : '未知错误'
        throw createError({
            statusCode: 500,
            message: '创建资源失败：' + errorMessage
        })
    }
})