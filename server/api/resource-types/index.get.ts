import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
    try {
        // 获取所有资源类型（这是公开的API，不需要验证）
        const types = await prisma.resourceType.findMany({
            orderBy: {
                name: 'asc'
            },
            select: {
                id: true,
                name: true,
                description: true
            }
        });

        return {
            code: 200,
            msg: "获取成功",
            data: types
        };
    } catch (error: any) {
        console.error('获取资源类型失败:', error);
        throw createError({
            statusCode: error.statusCode || 500,
            message: error.message || "服务器错误"
        });
    }
}); 