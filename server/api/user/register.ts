import prisma from "~/lib/prisma";
import jwt from "jsonwebtoken";
import { sendVerificationEmail } from "~/server/services/email/emailVerification";
import { getEmailServiceConfig } from "~/server/services/email/resend";
import {
    REGISTRATION_GIFT_SOURCE,
    grantRegistrationGiftForUser
} from "~/server/services/points/registrationGift.mjs";
import { hashPassword } from "~/server/utils/password";

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();

    try {
        const { email, password, username } = await readBody(event);

        if (!email || !password || !username) {
            return {
                code: 400,
                msg: '请填写完整的注册信息'
            }
        }

        // 检查用户是否已存在
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { username }
                ]
            }
        });

        if (existingUser) {
            return {
                code: 400,
                msg: '用户名或邮箱已被注册'
            }
        }

        // 判断是否是管理员注册
        const isAdminRegistration = email === config.adminEmail &&
            password === config.adminPassword &&
            username === config.adminUser;

        const emailConfig = await getEmailServiceConfig();
        const requiresEmailVerification = !isAdminRegistration &&
            emailConfig.enabled &&
            emailConfig.requireVerificationForNewUsers;

        // 加密密码
        const hashedPassword = await hashPassword(password);

        // 创建用户
        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                role: isAdminRegistration ? 'admin' : 'user',
                isVerified: isAdminRegistration || !requiresEmailVerification,
                emailVerifiedAt: isAdminRegistration || !requiresEmailVerification ? new Date() : null,
                emailVerificationRequired: requiresEmailVerification
            }
        });

        if (requiresEmailVerification) {
            try {
                await sendVerificationEmail({
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    isVerified: user.isVerified
                });
            } catch (error) {
                await prisma.user.delete({
                    where: {
                        id: user.id
                    }
                });
                throw error;
            }

            return {
                code: 200,
                msg: '注册成功，请前往邮箱完成激活',
                data: {
                    requiresEmailActivation: true,
                    email: user.email
                }
            }
        }

        const registrationGift = isAdminRegistration ? null : await grantRegistrationGiftForUser({
            userId: user.id,
            source: REGISTRATION_GIFT_SOURCE.auto
        });

        // 生成 JWT token
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            config.jwtSecret,
            { expiresIn: '24h' }
        );

        return {
            code: 200,
            msg: '注册成功',
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    isVerified: user.isVerified,
                    emailVerificationRequired: user.emailVerificationRequired,
                    points: registrationGift?.effectivePoints ?? user.points,
                    permanentPoints: registrationGift?.permanentPoints ?? user.points,
                    temporaryPoints: registrationGift?.temporaryPoints ?? 0,
                    effectivePoints: registrationGift?.effectivePoints ?? user.points,
                    nextExpiringAt: registrationGift?.nextExpiringAt ?? null,
                    pointsBreakdown: registrationGift?.pointsBreakdown ?? {
                        permanentPoints: user.points,
                        temporaryPoints: 0,
                        effectivePoints: user.points,
                        nextExpiringAt: null
                    }
                },
                registrationGift
            }
        }

    } catch (e) {
        console.error(e);
        return {
            code: 500,
            msg: '服务器错误'
        }
    }
})
