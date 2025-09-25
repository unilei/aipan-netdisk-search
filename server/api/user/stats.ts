import prisma from "~/lib/prisma"

export default defineEventHandler(async (event) => {
    try {
        // 检查用户是否已登录
        const user = event.context.user
        if (!user || !user.userId) {
            throw createError({
                statusCode: 401,
                statusMessage: "Unauthorized",
                message: "请先登录"
            })
        }

        // 获取用户资源数量
        const resourceCount = await prisma.resource.count({
            where: {
                creatorId: user.userId
            }
        })

        return {
            code: 200,
            data: {
                resourceCount
            }
        }
    } catch (error) {
        console.error('获取用户统计数据失败:', error)
        return {
            code: 500,
            message: '获取用户统计数据失败'
        }
    }
}) 