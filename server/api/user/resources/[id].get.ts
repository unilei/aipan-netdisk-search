import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
    try {
        const user = event.context.user;
        if (!user) {
            throw createError({
                statusCode: 401,
                message: "请先登录"
            });
        }

        const id = event.context.params?.id;
        if (!id) {
            throw createError({
                statusCode: 400,
                message: "资源ID不能为空"
            });
        }

        const resource = await prisma.userResource.findFirst({
            where: {
                id,
                creatorId: user.userId
            },
            include: {
                type: true,
                creator: {
                    select: {
                        id: true,
                        username: true,
                        email: true
                    }
                }
            }
        });

        if (!resource) {
            throw createError({
                statusCode: 404,
                message: "资源不存在"
            });
        }

        return {
            code: 200,
            msg: "获取成功",
            data: resource
        };
    } catch (error: any) {
        console.error('获取资源详情失败:', error);
        throw createError({
            statusCode: error.statusCode || 500,
            message: error.message || "服务器错误"
        });
    }
}); 