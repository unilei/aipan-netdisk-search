import prisma from "~/lib/prisma"

export default defineEventHandler(async (event) => {
    try {
        const { slug } = getRouterParams(event)

        if (!slug) {
            return {
                success: false,
                message: '主题不存在'
            }
        }

        // 查找主题
        const topic = await prisma.forumTopic.findUnique({
            where: { slug: decodeURI(slug) }
        })

        if (!topic) {
            return {
                success: false,
                message: '主题不存在'
            }
        }

        // 更新浏览次数
        await prisma.forumTopic.update({
            where: { id: topic.id },
            data: { viewCount: { increment: 1 } }
        })

        return {
            success: true,
            message: '浏览量已更新'
        }
    } catch (error) {
        console.error('更新浏览量失败:', error)
        return {
            success: false,
            message: '更新浏览量失败'
        }
    }
}) 