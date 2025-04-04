import prisma from "~/lib/prisma"
import { Prisma } from '@prisma/client'

export default defineEventHandler(async (event) => {
    try {
        // 检查管理员权限
        const user = event.context.user
        if (!user || user.role !== 'admin') {
            throw createError({
                statusCode: 403,
                statusMessage: "Forbidden",
                message: "需要管理员权限"
            })
        }

        const id = event.context.params?.id
        if (!id) {
            return {
                success: false,
                message: '分类ID不能为空'
            }
        }

        // 开启事务，删除分类下的所有主题和回复
        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // 查找该分类下的所有主题
            const topics = await tx.forumTopic.findMany({
                where: { categoryId: parseInt(id) },
                select: { id: true }
            })

            const topicIds = topics.map((topic: { id: number }) => topic.id)

            // 删除主题下的所有回复
            if (topicIds.length > 0) {
                await tx.forumPost.deleteMany({
                    where: { topicId: { in: topicIds } }
                })
            }

            // 删除所有主题
            await tx.forumTopic.deleteMany({
                where: { categoryId: parseInt(id) }
            })

            // 删除分类
            await tx.forumCategory.delete({
                where: { id: parseInt(id) }
            })
        })

        return {
            success: true,
            message: '分类删除成功'
        }
    } catch (error: any) {
        console.error('删除论坛分类失败:', error)
        if (error.statusCode) {
            throw error
        }
        return {
            success: false,
            message: '删除论坛分类失败'
        }
    }
}) 