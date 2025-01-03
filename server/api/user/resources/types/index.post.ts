import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
    // 确保用户已登录
    if (!event.context.user?.userId) {
        throw createError({
            statusCode: 401,
            message: '请先登录'
        })
    }

    const { name, description } = await readBody(event)
    const userId = event.context.user.userId

    if (!name) {
        throw createError({
            statusCode: 400,
            message: '类型名称不能为空'
        })
    }

    try {
        // 检查是否已存在同名类型
        const existingType = await prisma.resourceType.findFirst({
            where: {
                name,
                isUserType: true
            }
        })

        if (existingType) {
            throw createError({
                statusCode: 400,
                message: '该类型名称已存在'
            })
        }

        const type = await prisma.resourceType.create({
            data: {
                name,
                description,
                isUserType: true,
                isEnabled: true,
                creatorId: userId
            }
        })

        return {
            code: 200,
            msg: '创建成功',
            data: type
        }
    } catch (error: any) {
        console.error('创建用户资源类型失败:', error)
        throw createError({
            statusCode: error.statusCode || 500,
            message: error.message || '创建用户资源类型失败'
        })
    }
}) 