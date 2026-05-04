import prisma from "~/lib/prisma";
import { sendVerificationEmail } from "~/server/services/email/emailVerification";
import { getEmailServiceConfig } from "~/server/services/email/resend";

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

        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                isVerified: true,
                emailVerificationRequired: true
            }
        });

        if (!currentUser) {
            throw createError({
                statusCode: 404,
                message: '用户不存在'
            });
        }

        const emailChanged = currentUser.email !== email;
        const emailConfig = await getEmailServiceConfig();
        const shouldRequireReverification = emailChanged && emailConfig.enabled;

        // 更新用户信息
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                username,
                email,
                avatarStyle: avatarStyle || 'avataaars',
                isVerified: shouldRequireReverification ? false : currentUser.isVerified,
                emailVerifiedAt: shouldRequireReverification ? null : undefined,
                emailVerificationRequired: shouldRequireReverification
                    ? true
                    : currentUser.emailVerificationRequired
            },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                avatarStyle: true,
                createdAt: true,
                isVerified: true,
                emailVerificationRequired: true
            }
        });

        let message = '更新成功';

        if (shouldRequireReverification) {
            try {
                await sendVerificationEmail({
                    id: updatedUser.id,
                    username: updatedUser.username,
                    email: updatedUser.email,
                    isVerified: updatedUser.isVerified
                });
                message = '邮箱已更新，请重新激活';
            } catch (error) {
                console.error('邮箱变更后发送验证邮件失败:', error);
                message = '邮箱已更新，但验证邮件发送失败，请稍后重试';
            }
        }

        return {
            code: 200,
            msg: message,
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
