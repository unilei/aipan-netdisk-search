import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
    const userId = event.context.user.userId;
    const { username, email, avatarStyle } = await readBody(event);

    try {
        // 验证必填字段
        if (!username || !email) {
            throw createError({
                statusCode: 400,
                message: '请填写所有必填字段'
            });
        }

        // 检查用户名和邮箱是否已被其他用户使用
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username, id: { not: userId } },
                    { email, id: { not: userId } }
                ]
            }
        });

        if (existingUser) {
            throw createError({
                statusCode: 400,
                message: '用户名或邮箱已被使用'
            });
        }

        // 更新用户信息
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                username,
                email,
                avatarStyle: avatarStyle || 'avataaars'
            },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                avatarStyle: true,
                createdAt: true,
                isVerified: true
            }
        });

        return {
            code: 200,
            msg: '更新成功',
            data: updatedUser
        };
    } catch (error: any) {
        console.error('更新用户信息失败:', error);
        throw createError({
            statusCode: error.statusCode || 500,
            message: error.message || '更新用户信息失败'
        });
    }
}); 