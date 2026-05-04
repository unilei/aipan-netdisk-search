import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
    const { id } = getRouterParams(event)
    const userId = event.context.user.userId

    try {
        const resource = await prisma.userResource.findUnique({
            where: {
                id: Number(id)
            },
            include: {
                type: true,
                creator: {
                    select: {
                        id: true,
                        username: true,
                        email: true
                    }
                }
            }
        })

        if (!resource) {
            throw createError({
                statusCode: 404,
                message: '资源不存在'
            })
        }

        // 检查资源是否属于当前用户
        if (resource.creatorId !== userId) {
            throw createError({
                statusCode: 403,
                message: '无权访问此资源'
            })
        }

        return {
            code: 200,
            msg: 'success',
            data: resource
        }
    } catch (error: any) {
        console.error('获取资源详情失败:', error)
        throw createError({
            statusCode: error.statusCode || 500,
            message: error.message || '获取资源详情失败'
        })
    }
})