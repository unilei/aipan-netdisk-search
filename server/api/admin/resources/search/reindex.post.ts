import { verifyToken } from '~/server/model/user'
import prisma from "~/lib/prisma";
import { reindexResources } from "~/server/services/search/elasticsearchClient.js";

export default defineEventHandler(async (event) => {
    const token = getHeader(event, 'authorization')?.split(' ')[1]
    const user = token ? verifyToken(token) : null

    if (!user || user.role !== 'admin') {
        throw createError({
            statusCode: 403,
            message: '无权限访问'
        })
    }

    const body = await readBody(event)
    const reset = Boolean(body?.reset)

    try {
        const resources = await prisma.resource.findMany({
            include: {
                creator: {
                    select: {
                        id: true,
                        username: true,
                    }
                },
                type: true
            },
            orderBy: {
                id: 'asc'
            }
        })

        const result = await reindexResources(resources, { reset })

        return {
            code: 200,
            msg: '重建完成',
            data: result
        }
    } catch (error) {
        console.error('重建资源搜索索引失败:', error)
        throw createError({
            statusCode: 500,
            message: '重建资源搜索索引失败'
        })
    }
})
