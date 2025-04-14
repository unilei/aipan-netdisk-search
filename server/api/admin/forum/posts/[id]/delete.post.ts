import prisma from '~/lib/prisma'
 
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
        // 获取帖子ID
        const id = event.context.params?.id
        if (!id) {
            return {
                success: false,
                message: '未提供帖子ID'
            }
        }

        // 帖子ID转为数字
        const postId = parseInt(id)
        if (isNaN(postId)) {
            return {
                success: false,
                message: '无效的帖子ID'
            }
        }

        // 检查帖子是否存在
        const post = await prisma.forumPost.findUnique({
            where: { id: postId }
        })

        if (!post) {
            return {
                success: false,
                message: '帖子不存在'
            }
        }

        // 删除帖子
        await prisma.forumPost.delete({
            where: { id: postId }
        })

        return {
            success: true,
            message: '帖子已成功删除'
        }
    } catch (error) {
        console.error('删除帖子失败:', error)
        return {
            success: false,
            message: '删除帖子失败'
        }
    }
})
