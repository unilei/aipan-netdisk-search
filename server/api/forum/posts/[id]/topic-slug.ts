import prisma from "~/lib/prisma"

export default defineEventHandler(async (event) => {
    try {
        const { id } = getRouterParams(event)
        
        if (!id) {
            return {
                success: false,
                message: '帖子ID不能为空'
            }
        }

        // 查找帖子
        const post = await prisma.forumPost.findUnique({
            where: { id: parseInt(id) },
            include: {
                topic: true
            }
        })

        if (!post) {
            return {
                success: false,
                message: '帖子不存在'
            }
        }

        return {
            success: true,
            data: {
                slug: post.topic.slug
            }
        }
    } catch (error) {
        console.error('获取主题slug失败:', error)
        return {
            success: false,
            message: '获取主题slug失败'
        }
    }
})
