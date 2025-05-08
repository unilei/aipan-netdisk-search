import { v4 as uuidv4 } from 'uuid'
import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event)
        const { postId, content, author, email, website, parentId } = body

        // 生成删除token
        const deleteToken = uuidv4()

        // 生成头像URL
        const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${email || uuidv4()}`

        // 创建评论
        const comment = await prisma.comment.create({
            data: {
                postId: parseInt(postId),
                content,
                author,
                email,
                website,
                avatar,
                parentId: parentId ? parseInt(parentId) : null,
                deleteToken // 保存删除token
            }
        })

        return {
            code: 200,
            message: 'Comment created successfully',
            data: {
                ...comment,
                deleteToken // 返回删除token给客户端
            }
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