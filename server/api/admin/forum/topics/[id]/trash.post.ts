import prisma from "~/lib/prisma";
import { moveForumTopicToTrash } from "~/server/services/forum/topicTrash.mjs";

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
        const body = await readBody(event).catch(() => ({}))
        const topic = await moveForumTopicToTrash({
            topicId: id,
            actorId: user.userId || user.id,
            reason: body?.reason,
            prismaClient: prisma,
        })

        return {
            success: true,
            message: "主题已移入回收站",
            data: topic,
        }
    } catch (error: any) {
        console.error("移入论坛主题回收站失败:", error)
        if (error.statusCode) {
            throw error
        }
        return {
            success: false,
            message: "移入回收站失败"
        }
    }
})
