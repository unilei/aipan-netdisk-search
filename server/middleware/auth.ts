import { verifyToken } from "../model/user";
import type { H3Event } from 'h3';
import type { JwtPayload } from 'jsonwebtoken';

export default defineEventHandler(async (event: H3Event) => {
    try {
        // 检查是否是管理员API
        const isAdminRoute = event.node.req.url?.startsWith("/api/admin") ?? false;
        // 检查是否是需要认证的API
        const needsAuth = (
            isAdminRoute ||
            event.node.req.url?.startsWith("/api/user/resources") ||
            event.node.req.url?.startsWith("/api/user/blog/category") ||
            event.node.req.url?.startsWith("/api/user/blog/posts") ||
            event.node.req.url?.startsWith("/api/user/activities") ||
            event.node.req.url?.startsWith("/api/user/stats") ||
            event.node.req.url?.startsWith("/api/user/profile") ||
            event.node.req.url?.startsWith("/api/user/vod-config") ||
            (event.node.req.url?.startsWith("/api/user/protected") ?? false)
        );

        if (!needsAuth) {
            return;
        }

        const authHeader = event.node.req.headers["authorization"];

        if (!authHeader) {
            throw createError({
                statusCode: 401,
                statusMessage: "Unauthorized",
                message: "No authorization header provided"
            });
        }

        const token = authHeader.split(" ")[1];
        const user = verifyToken(token) as JwtPayload;

        if (!user) {
            throw createError({
                statusCode: 403,
                statusMessage: "Forbidden",
                message: "Invalid or expired token"
            });
        }

        // 检查管理员权限
        if (isAdminRoute && user.role !== "admin") {
            throw createError({
                statusCode: 403,
                statusMessage: "Access denied",
                message: "Admin privileges required"
            });
        }

        // 把用户信息添加到上下文中，供后续的 API 处理器使用
        event.context.user = user;
    } catch (error: any) {
        // 如果是已经创建的错误，直接抛出
        if (error.statusCode) {
            throw error;
        }
        // 其他未预期的错误
        console.error('Auth middleware error:', error);
        throw createError({
            statusCode: 500,
            statusMessage: "Internal Server Error",
            message: "An unexpected error occurred"
        });
    }
}); 