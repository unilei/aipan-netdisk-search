import GithubSlugger from 'github-slugger'
import prisma from "~/lib/prisma"
import sensitiveWordFilter from '~/utils/sensitiveWordFilter'

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

        // 创建slug
        const slugger = new GithubSlugger()
        let slug = slugger.slug(title)

        // 如果无法从标题生成有效的slug，使用时间戳
        if (!slug || slug === '') {
            slug = `topic-${Date.now()}`
        }

        // 检查slug是否已存在
        const existingTopicWithSlug = await prisma.forumTopic.findUnique({
            where: { slug }
        })

        if (existingTopicWithSlug) {
            // 如果slug已存在，添加时间戳后缀
            slug = `${slug}-${Date.now().toString().slice(-6)}`
        }

        // 判断用户角色，管理员创建的主题直接审核通过
        const status = user.role === 'admin' ? 'approved' : 'approved';

        // 创建主题
        const topic = await prisma.forumTopic.create({
            data: {
                title: sensitiveWordFilter.filter(title),
                content: sensitiveWordFilter.filter(content),
                slug,
                authorId: user.userId,
                categoryId: Number(categoryId),
                status: status // 添加状态字段，非管理员创建的主题默认为待审核状态
            }
        })

        return {
            success: true,
            message: status === 'approved' ? '主题发布成功' : '主题已提交，等待审核',
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