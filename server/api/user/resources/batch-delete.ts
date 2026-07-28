import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { ids } = body;
    const userId = event.context.user.userId;

    if (!Array.isArray(ids) || ids.length === 0 || ids.length > 100) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid request: No IDs provided' });
    }

    const normalizedIds = [...new Set(ids.map((id) => Number(id)))];
    if (normalizedIds.some((id) => !Number.isInteger(id) || id <= 0)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid resource IDs' });
    }

    try {
        // 只删除当前用户尚未发布的投稿，绝不触碰正式 Resource 表。
        const result = await prisma.userResource.deleteMany({
            where: {
                id: {
                    in: normalizedIds,
                },
                creatorId: userId,
                status: {
                    not: 'published',
                },
            },
        });

        return {
            code: 200,
            msg: 'Resources deleted successfully',
            data: {
                deletedCount: result.count,
            },
        };
    } catch (error) {
        console.error('Error deleting resources:', error);
        throw createError({ statusCode: 500, statusMessage: 'Failed to delete resources' });
    }
});
