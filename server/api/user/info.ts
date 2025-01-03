import prisma from "~/lib/prisma";
import { verifyToken } from "~/server/model/user";

export default defineEventHandler(async (event) => {
    try {
        const authHeader = event.node.req.headers["authorization"];
        if (!authHeader) {
            throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
        }

        const token = authHeader.split(" ")[1];
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
                createdAt: true,
                isVerified: true
            }
        });

        if (!user) {
            throw createError({ statusCode: 404, statusMessage: "User not found" });
        }

        return {
            code: 200,
            msg: "success",
            data: user
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