import { verifyToken } from '~/server/model/user'
import prisma from '~/server/utils/prisma'

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

    // 更新资源状态
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

    return resource
}) 