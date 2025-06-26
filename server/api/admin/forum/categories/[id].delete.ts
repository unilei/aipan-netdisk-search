import prisma from "~/lib/prisma"

export default defineEventHandler(async (event) => {
    try {
        // 权限验证
        const user = event.context.user
        if (!user || user.role !== "admin") {
            throw createError({
                statusCode: 403,
                statusMessage: "Forbidden",
                message: "需要管理员权限"
            })
        }

        // 获取分类ID
        const id = parseInt(event.context.params?.id || '')
        if (!id || isNaN(id)) {
            return {
                success: false,
                message: '无效的分类ID'
            }
        }

        // 检查分类是否存在
        const category = await prisma.forumCategory.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { topics: true }
                }
            }
        })

        if (!category) {
            return {
                success: false,
                message: '分类不存在'
            }
        }

        // 警告：如果分类下有主题，需要先确认删除
        if (category._count.topics > 0) {
            // 先获取主题列表
            const topics = await prisma.forumTopic.findMany({
                where: { categoryId: id },
                select: { id: true }
            })

            // 获取这些主题下的所有回复ID
            const topicIds = topics.map((t: { id: number }) => t.id)

            // 删除所有这些主题下的回复
            await prisma.forumPost.deleteMany({
                where: { topicId: { in: topicIds } }
            })

            // 删除所有主题
            await prisma.forumTopic.deleteMany({
                where: { categoryId: id }
            })
        }

        // 删除分类
        await prisma.forumCategory.delete({
            where: { id }
        })

        return {
            success: true,
            message: '分类已删除'
        }
    } catch (error) {
        console.error('删除分类失败:', error)
        return {
            success: false,
            message: '删除分类失败'
        }
    }
}) 