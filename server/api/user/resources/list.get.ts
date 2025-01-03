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

        // 获取查询参数
        const query = getQuery(event);
        const page = Number(query.page) || 1;
        const pageSize = Number(query.pageSize) || 10;
        const status = query.status as string || undefined;

        // 构建查询条件
        const where = {
            creatorId: user.userId,
            ...(status && { status })
        };

        // 获取总数
        const total = await prisma.userResource.count({ where });

        // 获取分页数据
        const resources = await prisma.userResource.findMany({
            where,
            include: {
                type: true,
                creator: {
                    select: {
                        id: true,
                        username: true,
                        email: true
                    }
                }
            },
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: {
                createdAt: 'desc'
            }
        });

        return {
            code: 200,
            msg: "获取成功",
            data: {
                list: resources,
                pagination: {
                    page,
                    pageSize,
                    total,
                    totalPages: Math.ceil(total / pageSize)
                }
            }
        };
    } catch (error: any) {
        console.error('获取用户资源列表失败:', error);
        throw createError({
            statusCode: error.statusCode || 500,
            message: error.message || "服务器错误"
        });
    }
}); 