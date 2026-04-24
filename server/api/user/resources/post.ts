import prisma from "~/lib/prisma";
import { scheduleUserResourceAutoReview } from "~/server/services/userResources/autoReviewRunner.js";

export default defineEventHandler(async (event) => {
    // 确保用户已登录
    if (!event.context.user?.userId) {
        throw createError({
            statusCode: 401,
            message: '请先登录'
        })
    }

    const userId = event.context.user.userId;
    const { name, typeId, links, description } = await readBody(event);

    // 验证必填字段
    if (!name || !typeId || !links || !description) {
        throw createError({
            statusCode: 400,
            message: '请填写所有必填字段'
        })
    }

    try {
        // 检查资源类型是否存在
        const resourceType = await prisma.resourceType.findUnique({
            where: {
                id: Number(typeId)
            }
        })

        if (!resourceType) {
            throw createError({
                statusCode: 400,
                message: '资源类型不存在'
            })
        }

        // 创建资源
        const resource = await prisma.userResource.create({
            data: {
                name,
                typeId: Number(typeId),
                links: typeof links === 'string' ? links : JSON.stringify(links),
                description,
                creatorId: userId,
                status: 'pending',  // 默认状态为待审核
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

        const autoReviewScheduled = scheduleUserResourceAutoReview(resource.id, {
            notifyUser: true
        })

        return {
            code: 200,
            msg: autoReviewScheduled
                ? '创建成功，系统将自动审核并通过站内通知和邮件告知结果'
                : '创建成功，等待管理员审核',
            data: {
                ...resource,
                autoReviewScheduled
            }
        }
    } catch (error: any) {
        console.error('创建资源失败:', error)
        throw createError({
            statusCode: error.statusCode || 500,
            message: error.message || '创建资源失败'
        })
    }
})
