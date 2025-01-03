import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
    // 确保用户已登录
    if (!event.context.user?.userId) {
        throw createError({
            statusCode: 401,
            message: '请先登录'
        })
    }

    try {
        const types = await prisma.resourceType.findMany({
            where: {
                isUserType: true,
                isEnabled: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return {
            code: 200,
            msg: 'success',
            data: types
        }
    } catch (error: any) {
        console.error('获取用户资源类型失败:', error)
        throw createError({
            statusCode: 500,
            message: error.message || '获取用户资源类型失败'
        })
    }
}) 