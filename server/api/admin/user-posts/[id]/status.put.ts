import { verifyToken } from '~/server/model/user'
import prisma from "~/lib/prisma";

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

    // 更新博客文章状态
    const post = await prisma.blogPost.update({
        where: { id },
        data: { status },
        include: {
            author: {
                select: {
                    id: true,
                    username: true,
                    email: true
                }
            },
            categories: {
                include: {
                    category: true
                }
            }
        }
    })

    return post
}) 