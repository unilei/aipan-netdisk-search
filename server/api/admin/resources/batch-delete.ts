import prisma from "~/lib/prisma";
import { removeResource } from "~/server/services/search/elasticsearchClient.js";

export default defineEventHandler(async (event) => {
    const body = await readBody(event); // 读取请求体
    const { ids } = body; // 期望接收到一个包含 ID 的数组
    const userId = event.context.user.userId; // 获取用户 ID（如果需要）

    if (!Array.isArray(ids) || ids.length === 0) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid request: No IDs provided' });
    }

    try {
        const numericIds = ids.map(id => Number(id));

        // 使用 Prisma 的 deleteMany 方法删除多个资源
        await prisma.resource.deleteMany({
            where: {
                id: {
                    in: numericIds,
                },
            },
        });

        // 逐条从 ES 删除，失败不阻断
        for (const resourceId of numericIds) {
            try {
                await removeResource(resourceId);
            } catch (esError) {
                console.error(`从 ES 删除资源 ${resourceId} 失败:`, esError);
            }
        }

        return {
            code: 200,
            msg: 'Resources deleted successfully',
            data: [],
        };
    } catch (error) {
        console.error('Error deleting resources:', error);
        throw createError({ statusCode: 500, statusMessage: 'Failed to delete resources' });
    }
});
