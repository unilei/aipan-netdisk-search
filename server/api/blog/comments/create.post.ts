import { PrismaClient } from '@prisma/client'
import sensitiveWordFilter from '~/utils/sensitiveWordFilter'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event)
        const { postId, content, author, email, website, parentId } = body

        // 基本验证
        if (!postId || !content) {
            return {
                code: 400,
                message: 'Missing required fields',
                error: 'Post ID and content are required'
            }
        }

        // 服务端敏感词过滤
        const hasSensitiveWords = sensitiveWordFilter.hasSensitiveWords(content)
        if (hasSensitiveWords) {
            const sensitiveWords = sensitiveWordFilter.findSensitiveWords(content)
            return {
                code: 400,
                message: `评论包含敏感词：${sensitiveWords.join('、')}`,
                error: 'Comment contains sensitive words'
            }
        }

        // 创建评论
        const comment = await prisma.comment.create({
            data: {
                postId: parseInt(postId),
                content,
                author: author || 'Anonymous',
                email,
                website,
                parentId: parentId ? parseInt(parentId) : null,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email || Math.random()}` // 使用 DiceBear 生成头像
            }
        })

        return {
            code: 200,
            message: 'Comment created successfully',
            data: comment
        }
    } catch (error) {
        console.error('Error creating comment:', error)
        return {
            code: 500,
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}) 