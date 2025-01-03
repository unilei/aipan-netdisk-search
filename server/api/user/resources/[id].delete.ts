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

        // 验证资源是否存在且属于当前用户
        const existingResource = await prisma.userResource.findFirst({
            where: {
                id,
                creatorId: user.userId
            }
        });

        if (!existingResource) {
            throw createError({
                statusCode: 404,
                message: "资源不存在或无权限删除"
            });
        }

        // 删除资源
        await prisma.userResource.delete({
            where: { id }
        });

        return {
            code: 200,
            msg: "删除成功"
        };
    } catch (error: any) {
        console.error('删除资源失败:', error);
        throw createError({
            statusCode: error.statusCode || 500,
            message: error.message || "服务器错误"
        });
    }
}); 