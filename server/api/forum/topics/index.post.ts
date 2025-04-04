import { PrismaClient } from '@prisma/client'
import slugify from 'slugify'
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

        // 生成唯一的slug
        let slug = slugify(title, { lower: true, strict: true })
        const existingTopicWithSlug = await prisma.forumTopic.findUnique({
            where: { slug }
        })

        if (existingTopicWithSlug) {
            // 如果slug已存在，添加随机后缀
            slug = `${slug}-${Date.now().toString().slice(-6)}`
        }

        // 创建主题
        const topic = await prisma.forumTopic.create({
            data: {
                title,
                content,
                slug,
                categoryId: parseInt(categoryId),
                authorId: user.userId,
            }
        })

        return {
            success: true,
            data: topic
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