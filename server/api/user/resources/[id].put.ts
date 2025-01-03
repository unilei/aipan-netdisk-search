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
                message: "资源不存在或无权限修改"
            });
        }

        const body = await readBody(event);
        const { name, links, description } = body;

        // 验证必填字段
        if (!name?.trim() || !links || !description?.trim()) {
            throw createError({
                statusCode: 400,
                message: "请填写完整的资源信息"
            });
        }

        // 更新资源
        const updatedResource = await prisma.userResource.update({
            where: { id },
            data: {
                name,
                links,
                description,
                status: 'pending' // 更新后重新进入待审核状态
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        username: true,
                        email: true
                    }
                }
            }
        });

        return {
            code: 200,
            msg: "更新成功，等待审核",
            data: updatedResource
        };
    } catch (error: any) {
        console.error('更新资源失败:', error);
        throw createError({
            statusCode: error.statusCode || 500,
            message: error.message || "服务器错误"
        });
    }
}); 