import prisma from "~/lib/prisma";
import { scheduleUserResourceAutoReview } from "~/server/services/userResources/autoReviewRunner.js";

export default defineEventHandler(async (event) => {
    const { id } = getRouterParams(event)
    const userId = event.context.user.userId
    const { name, typeId, links, description } = await readBody(event)

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
                message: '无权修改此资源'
            })
        }

        // 如果资源已经审核通过或被拒绝，不允许修改
        if (resource.status !== 'pending') {
            throw createError({
                statusCode: 400,
                message: '只能修改待审核的资源'
            })
        }

        const updatedResource = await prisma.userResource.update({
            where: {
                id: Number(id)
            },
            data: {
                name,
                type: {
                    connect: {
                        id: Number(typeId)
                    }
                },
                links,
                description,
                status: 'pending' // 修改后重置为待审核状态
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

        const autoReviewScheduled = scheduleUserResourceAutoReview(updatedResource.id, {
            notifyUser: true
        })

        return {
            code: 200,
            msg: autoReviewScheduled
                ? '更新成功，系统将自动重新审核并通知你结果'
                : '更新成功，等待重新审核',
            data: {
                ...updatedResource,
                autoReviewScheduled
            }
        }
    } catch (error: any) {
        console.error('更新资源失败:', error)
        throw createError({
            statusCode: error.statusCode || 500,
            message: error.message || '更新资源失败'
        })
    }
})
