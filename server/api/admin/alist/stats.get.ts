import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
    // 验证用户
    if (!event.context.user) {
        return createError({
            statusCode: 401,
            message: 'Unauthorized'
        })
    }

    try {
        // 获取Alist源总数
        const count = await prisma.alist.count()
        
        return {
            code: 200,
            count
        }
    } catch (error) {
        console.error('Error fetching alist sources count:', error)
        return createError({
            statusCode: 500,
            message: 'Internal server error'
        })
    }
})
