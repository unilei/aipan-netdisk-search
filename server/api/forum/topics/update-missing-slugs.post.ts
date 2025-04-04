import prisma from "~/lib/prisma"
import GithubSlugger from 'github-slugger'

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

        // 获取所有slug为空的主题
        const topics = await prisma.forumTopic.findMany({
            where: {
                slug: ""
            }
        })

        const results = []
        const slugger = new GithubSlugger()

        // 逐个更新主题的slug
        for (const topic of topics) {
            // 使用GithubSlugger生成基于标题和ID的slug
            let slug = slugger.slug(`${topic.title}-${topic.id}`)

            // 如果无法从标题生成有效的slug，则使用ID
            if (!slug || slug === '') {
                slug = `topic-${topic.id}`
            }

            // 检查slug是否已存在（除了当前主题）
            const slugExists = await prisma.forumTopic.findFirst({
                where: {
                    slug,
                    id: { not: topic.id }
                }
            })

            // 如果slug已存在，添加时间戳后缀
            if (slugExists) {
                slug = `${slug}-${Date.now().toString().slice(-6)}`
            }

            // 更新主题
            const updated = await prisma.forumTopic.update({
                where: { id: topic.id },
                data: { slug }
            })

            results.push({
                id: topic.id,
                title: topic.title,
                oldSlug: topic.slug || "",
                newSlug: updated.slug
            })
        }

        return {
            success: true,
            message: `更新了 ${results.length} 个主题的slug`,
            data: results
        }
    } catch (error) {
        console.error('更新主题slug失败:', error)
        return {
            success: false,
            message: '更新主题slug失败'
        }
    }
}) 