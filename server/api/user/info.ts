import prisma from "~/lib/prisma";
import { verifyToken } from "~/server/model/user";
import { getUserPointsBreakdown } from "~/server/services/points/userPoints";

export default defineEventHandler(async (event) => {
    try {
        // 设置防止缓存的响应头
        setHeader(event, 'Cache-Control', 'no-cache, no-store, must-revalidate, private');
        setHeader(event, 'Pragma', 'no-cache');
        setHeader(event, 'Expires', '0');
        setHeader(event, 'Last-Modified', new Date().toUTCString());

        const authHeader = event.node.req.headers["authorization"];
        if (!authHeader) {
            throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            throw createError({ statusCode: 401, statusMessage: "Invalid token format" });
        }
        const decoded = verifyToken(token);
        if (!decoded) {
            throw createError({ statusCode: 403, statusMessage: "Forbidden" });
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                avatarStyle: true,
                points: true,
                createdAt: false,
                isVerified: true,
                emailVerificationRequired: true
            }
        });

        if (!user) {
            throw createError({ statusCode: 404, statusMessage: "User not found" });
        }

        const pointsBreakdown = await getUserPointsBreakdown(decoded.userId, {
            permanentPoints: user.points
        });

        return {
            code: 200,
            msg: "success",
            data: {
                ...user,
                points: pointsBreakdown.effectivePoints,
                permanentPoints: pointsBreakdown.permanentPoints,
                temporaryPoints: pointsBreakdown.temporaryPoints,
                effectivePoints: pointsBreakdown.effectivePoints,
                nextExpiringAt: pointsBreakdown.nextExpiringAt,
                pointsBreakdown
            }
        };
    } catch (error) {
        console.error(error);
        return {
            code: 500,
            msg: "服务器错误",
            error
        };
    }
});
