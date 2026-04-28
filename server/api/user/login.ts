import prisma from "~/lib/prisma";
import jwt from "jsonwebtoken";
import { verifyAndUpgradePassword } from "~/server/utils/password";

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();

    try {
        const { email, password } = await readBody(event);

        if (!email || !password) {
            return {
                code: 400,
                msg: '请填写完整的登录信息'
            }
        }

        // 查找用户
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return {
                code: 400,
                msg: '用户不存在'
            }
        }

        // 验证密码
        const passwordResult = await verifyAndUpgradePassword(user, password);
        if (!passwordResult.isValid) {
            return {
                code: 400,
                msg: '密码错误'
            }
        }

        if (user.emailVerificationRequired && !user.isVerified) {
            return {
                code: 403,
                msg: '请先完成邮箱验证',
                data: {
                    requiresEmailActivation: true,
                    email: user.email
                }
            }
        }

        // 生成 JWT token
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            config.jwtSecret,
            { expiresIn: '24h' }
        );

        return {
            code: 200,
            msg: '登录成功',
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    isVerified: user.isVerified,
                    emailVerificationRequired: user.emailVerificationRequired
                },
                showEmailActivationPrompt: !user.isVerified
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
