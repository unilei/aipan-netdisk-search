import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
    const { id } = getRouterParams(event)
    const userId = event.context.user.userId

    try {
        const resource = await prisma.userResource.findUnique({
            where: {
                id: Number(id)
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
                message: '无权删除此资源'
            })
        }

        // 如果资源已经审核通过，不允许删除
        if (resource.status === 'published') {
            throw createError({
                statusCode: 400,
                message: '已发布的资源不能删除'
            })
        }

        await prisma.userResource.delete({
            where: {
                id: Number(id)
            }
        })

        return {
            code: 200,
            msg: '删除成功',
            data: null
        }
    } catch (error: any) {
        console.error('删除资源失败:', error)
        throw createError({
            statusCode: error.statusCode || 500,
            message: error.message || '删除资源失败'
        })
    }
})