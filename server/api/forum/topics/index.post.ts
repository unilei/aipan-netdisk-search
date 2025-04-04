import { PrismaClient } from '@prisma/client'
import GithubSlugger from 'github-slugger'
import prisma from "~/lib/prisma"

export default defineEventHandler(async (event) => {
    try {
        // 检查用户是否已登录
        const user = event.context.user
        if (!user || !user.userId) {
            throw createError({
                statusCode: 401,
                statusMessage: "Unauthorized",
                message: "请先登录"
            })
        }

        const body = await readBody(event)
        const { title, content, categoryId } = body

        // 基本验证
        if (!title || !content || !categoryId) {
            return {
                success: false,
                message: '标题、内容和分类不能为空'
            }
        }

        // 使用 GithubSlugger 生成初始 slug（与博客系统类似）
        const slugger = new GithubSlugger()
        let initSlug = slugger.slug(title)

        // 如果无法从标题生成有效的slug，使用时间戳
        if (!initSlug || initSlug === '') {
            initSlug = `topic-${Date.now()}`
        }

        // 检查slug是否已存在
        const existingTopicWithSlug = await prisma.forumTopic.findUnique({
            where: { slug: initSlug }
        })

        if (existingTopicWithSlug) {
            // 如果slug已存在，添加时间戳后缀
            initSlug = `${initSlug}-${Date.now().toString().slice(-6)}`
        }

        // 创建主题
        const topic = await prisma.forumTopic.create({
            data: {
                title,
                content,
                slug: initSlug,
                categoryId: parseInt(categoryId),
                authorId: user.userId,
            }
        })

        // 创建更具体的最终slug（包含主题ID）
        const finalSlug = slugger.slug(`${title}-${topic.id}`)

        // 更新主题的slug
        const updatedTopic = await prisma.forumTopic.update({
            where: { id: topic.id },
            data: { slug: finalSlug }
        })

        return {
            success: true,
            data: updatedTopic
        }
    } catch (error: any) {
        console.error('创建主题失败:', error)
        if (error.statusCode) {
            throw error
        }
        return {
            success: false,
            message: '创建主题失败'
        }
    }
}) 