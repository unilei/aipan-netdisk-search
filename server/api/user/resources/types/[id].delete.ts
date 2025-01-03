import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
    // 确保用户已登录
    if (!event.context.user?.userId) {
        throw createError({
            statusCode: 401,
            message: '请先登录'
        })
    }

    const { id } = getRouterParams(event)
    const userId = event.context.user.userId

    try {
        const type = await prisma.resourceType.findUnique({
            where: {
                id: Number(id)
            }
        })

        if (!type) {
            throw createError({
                statusCode: 404,
                message: '资源类型不存在'
            })
        }

        // 检查是否是用户类型
        if (!type.isUserType) {
            throw createError({
                statusCode: 403,
                message: '无权删除此资源类型'
            })
        }

        // 检查是否有关联的资源
        const resourceCount = await prisma.userResource.count({
            where: {
                typeId: Number(id)
            }
        })

        if (resourceCount > 0) {
            throw createError({
                statusCode: 400,
                message: '该类型下还有资源，无法删除'
            })
        }

        await prisma.resourceType.delete({
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
        console.error('删除用户资源类型失败:', error)
        throw createError({
            statusCode: error.statusCode || 500,
            message: error.message || '删除用户资源类型失败'
        })
    }
}) 