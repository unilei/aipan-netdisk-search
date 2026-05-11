import { verifyToken } from '~/server/model/user'
import prisma from "~/lib/prisma";
import {
    MODERATION_CONTEXTS,
    evaluateModerationWithConfig,
    summarizeModerationDecision,
} from "~/server/utils/moderation";

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

    // 获取查询参数
    const query = getQuery(event)
    const page = parseInt(query.page as string) || 1
    const pageSize = parseInt(query.pageSize as string) || 10
    const status = query.status as string || undefined
    const search = query.search as string || undefined
    const includeModeration = query.includeModeration === 'true'

    // 构建查询条件
    const where = {
        ...(status && { status }),
        ...(search && {
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ]
        })
    }

    // 查询总数
    const total = await prisma.userResource.count({ where })

    // 查询数据
    const resources = await prisma.userResource.findMany({
        where,
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
            createdAt: 'desc'
        },
        skip: (page - 1) * pageSize,
        take: pageSize
    })

    const data = includeModeration
        ? await Promise.all(resources.map(async (resource) => {
            const moderation = await evaluateModerationWithConfig(
                `${resource.name || ''}\n${resource.description || ''}`,
                { context: MODERATION_CONTEXTS.userResource }
            )

            return {
                ...resource,
                moderation: summarizeModerationDecision(moderation)
            }
        }))
        : resources

    return {
        data,
        pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize)
        }
    }
})
