import { verifyToken } from '~/server/model/user'
import prisma from "~/lib/prisma";
import { reindexPublishedUserResources } from "~/server/services/search/elasticsearchClient.js";

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
        const resources = await prisma.userResource.findMany({
            where: {
                status: 'published'
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        username: true,
                        email: true
                    }
                },
                type: true
            },
            orderBy: {
                id: 'asc'
            }
        })

        const result = await reindexPublishedUserResources(resources, { reset })

        return {
            code: 200,
            msg: '重建完成',
            data: result
        }
    } catch (error) {
        console.error('重建用户投稿搜索索引失败:', error)
        throw createError({
            statusCode: 500,
            message: '重建用户投稿搜索索引失败'
        })
    }
})
