import { v4 as uuidv4 } from 'uuid'
import prisma from "~/lib/prisma";
import {
    evaluateModerationWithConfig,
    maskModeratedText,
    MODERATION_ACTIONS,
    MODERATION_CONTEXTS,
    summarizeModerationDecision,
} from "~/server/utils/moderation";

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event)
        const { postId, content, email, website, parentId } = body
        const author = body.author?.trim() || '匿名用户'

        // 基本验证
        if (!postId || !content) {
            return {
                code: 400,
                message: 'Missing required fields',
                error: 'Post ID and content are required'
            }
        }

        const moderation = await evaluateModerationWithConfig(content, {
            context: MODERATION_CONTEXTS.blogComment,
        })
        if (!moderation.allowed) {
            return {
                code: 400,
                message: moderation.message || '评论包含敏感信息，请修改后重新提交',
                error: 'Comment blocked by moderation',
                moderation: summarizeModerationDecision(moderation)
            }
        }
        const moderatedContent = moderation.action === MODERATION_ACTIONS.mask
            ? maskModeratedText(content, moderation.matches)
            : content

        // 创建评论
        const comment = await prisma.comment.create({
            data: {
                postId: parseInt(postId),
                content: moderatedContent,
                author,
                email,
                website,
                avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${author}`,
                parentId: parentId ? parseInt(parentId) : null,
                deleteToken: uuidv4()
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
