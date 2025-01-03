import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
    const body = await readBody(event); // 读取请求体
    const { ids } = body; // 期望接收到一个包含 ID 的数组
    const userId = event.context.user.userId; // 获取用户 ID（如果需要）

    if (!Array.isArray(ids) || ids.length === 0) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid request: No IDs provided' });
    }

    try {
        // 使用 Prisma 的 deleteMany 方法删除多个资源
        await prisma.resource.deleteMany({
            where: {
                id: {
                    in: ids.map(id => Number(id)), // 将 ID 转换为数字
                },
            },
        });

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
