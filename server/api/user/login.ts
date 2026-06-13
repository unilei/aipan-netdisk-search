import prisma from "~/lib/prisma";
import jwt from "jsonwebtoken";
import { getUserPointsBreakdown } from "~/server/services/points/userPoints";
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
        const pointsBreakdown = await getUserPointsBreakdown(user.id, {
            permanentPoints: user.points
        });

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
                    emailVerificationRequired: user.emailVerificationRequired,
                    points: pointsBreakdown.effectivePoints,
                    permanentPoints: pointsBreakdown.permanentPoints,
                    temporaryPoints: pointsBreakdown.temporaryPoints,
                    effectivePoints: pointsBreakdown.effectivePoints,
                    nextExpiringAt: pointsBreakdown.nextExpiringAt,
                    pointsBreakdown
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
