import prisma from "~/lib/prisma";
import { restoreForumTopicFromTrash } from "~/server/services/forum/topicTrash.mjs";

export default defineEventHandler(async (event) => {
    try {
        const user = event.context.user
        if (!user || user.role !== "admin") {
            throw createError({
                statusCode: 403,
                statusMessage: "Forbidden",
                message: "需要管理员权限"
            })
        }

        const id = parseInt(event.context.params?.id || "")
        const topic = await restoreForumTopicFromTrash({
            topicId: id,
            prismaClient: prisma,
        })

        return {
            success: true,
            message: "主题已恢复",
            data: topic,
        }
    } catch (error: any) {
        console.error("恢复论坛主题失败:", error)
        if (error.statusCode) {
            throw error
        }
        return {
            success: false,
            message: "恢复主题失败"
        }
    }
})
