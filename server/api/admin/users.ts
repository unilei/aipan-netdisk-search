import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
    // 验证管理员权限
    const user = event.context.user;
    if (!user || user.role !== 'admin') {
        return {
            code: 403,
            msg: '无权限访问'
        };
    }

    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                email: true,
                role: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return {
            code: 200,
            data: users
        };
    } catch (error) {
        console.error('获取用户列表失败:', error);
        return {
            code: 500,
            msg: '获取用户列表失败'
        };
    }
}); 