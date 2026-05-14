import prisma from "~/lib/prisma";
import { FORUM_TOPIC_PUBLIC_STATUS } from "~/server/services/forum/topicTrash.mjs";

export default defineEventHandler(async (event) => {
    try {
        const categories = await prisma.forumCategory.findMany({
            orderBy: {
                order: 'asc'
            },
            include: {
                _count: {
                    select: {
                        topics: {
                            where: {
                                status: FORUM_TOPIC_PUBLIC_STATUS
                            }
                        }
                    }
                }
            }
        })

        return {
            success: true,
            data: categories
        }
    } catch (error) {
        console.error('获取论坛分类失败:', error)
        return {
            success: false,
            message: '获取论坛分类失败'
        }
    }
})
