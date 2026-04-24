import { verifyToken } from '~/server/model/user'
import prisma from "~/lib/prisma";
import {
    removePublishedUserResource,
    syncPublishedUserResource,
} from "~/server/services/search/elasticsearchClient.js";

export default defineEventHandler(async (event) => {
    // 验证管理员权限
    const token = getHeader(event, 'authorization')?.split(' ')[1]
    const user = token ? verifyToken(token) : null
    
    if (!user || user.role !== 'admin') {
        throw createError({
            statusCode: 403,
            message: '无权限访问'
        })
    }

    const id = parseInt(event.context.params?.id || '')
    const body = await readBody(event)
    const { status } = body

    if (!['pending', 'published', 'rejected'].includes(status)) {
        throw createError({
            statusCode: 400,
            message: '无效的状态值'
        })
    }

    const existingResource = await prisma.userResource.findUnique({
        where: { id },
        include: {
            creator: {
                select: {
                    id: true,
                    username: true,
                    email: true
                }
            },
            type: true
        }
    })

    if (!existingResource) {
        throw createError({
            statusCode: 404,
            message: '资源不存在'
        })
    }

    if (existingResource.status === status) {
        return existingResource
    }

    const previousStatus = existingResource.status

    const resource = await prisma.userResource.update({
        where: { id },
        data: { status },
        include: {
            creator: {
                select: {
                    id: true,
                    username: true,
                    email: true
                }
            },
            type: true
        }
    })

    const shouldIndex = status === 'published'
    const shouldDelete = previousStatus === 'published' && status !== 'published'

    if (!shouldIndex && !shouldDelete) {
        return resource
    }

    try {
        if (shouldIndex) {
            await syncPublishedUserResource(resource)
        } else {
            await removePublishedUserResource(resource.id)
        }
    } catch (error) {
        console.error('同步资源搜索索引失败:', error)

        try {
            await prisma.userResource.update({
                where: { id },
                data: { status: previousStatus }
            })
        } catch (rollbackError) {
            console.error('回滚资源状态失败:', rollbackError)
        }

        throw createError({
            statusCode: 500,
            message: '资源状态更新失败，搜索索引同步未完成'
        })
    }

    return resource
})
