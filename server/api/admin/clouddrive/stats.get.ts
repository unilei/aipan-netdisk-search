import prisma from '~/lib/prisma'

export default defineEventHandler(async (event) => {
    // 验证用户
    if (!event.context.user) {
        return createError({
            statusCode: 401,
            message: 'Unauthorized'
        })
    }

    try {
        // 获取云盘文件总数
        const count = await prisma.resource.count()
        
        return {
            code: 200,
            count
        }
    } catch (error) {
        console.error('Error fetching cloud drive files count:', error)
        return createError({
            statusCode: 500,
            message: 'Internal server error'
        })
    }
})
