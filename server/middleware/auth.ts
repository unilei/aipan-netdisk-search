import { verifyToken } from "../model/user";
import type { H3Event } from 'h3';
import prisma from "~/lib/prisma";
import { resolveAuthenticatedUser } from "~/server/services/auth/authenticatedUser.mjs";

const PUBLIC_USER_ROUTES = new Set([
    "/api/user/login",
    "/api/user/register",
    "/api/user/email/verify",
    "/api/user/email/resend",
]);

const getRequestPath = (event: H3Event) => {
    const requestUrl = event.node.req.url || "/";
    return new URL(requestUrl, "http://localhost").pathname.replace(/\/+$/, "") || "/";
};

export default defineEventHandler(async (event: H3Event) => {
    try {
        if (event.node.req.method === "OPTIONS") {
            return;
        }

        const requestPath = getRequestPath(event);
        // 检查是否是管理员API
        const isAdminRoute = requestPath.startsWith("/api/admin");
        const isUserRoute = requestPath.startsWith("/api/user/");
        const isPublicUserRoute = PUBLIC_USER_ROUTES.has(requestPath);
        // 检查是否是需要认证的API
        const needsAuth = (
            isAdminRoute ||
            (isUserRoute && !isPublicUserRoute) ||
            requestPath.startsWith("/api/upload") ||
            requestPath.startsWith("/api/notifications") ||
            requestPath.startsWith("/api/chat")
        );

        const authHeader = event.node.req.headers["authorization"];
        const usesOptionalAuth = (
            requestPath.startsWith("/api/blog/comments/") ||
            requestPath === "/api/quark/validate" ||
            requestPath === "/api/user/email/resend"
        );

        if (!needsAuth && (!authHeader || !usesOptionalAuth)) {
            return;
        }

        if (!authHeader) {
            throw createError({
                statusCode: 401,
                statusMessage: "Unauthorized",
                message: "No authorization header provided"
            });
        }

        const [scheme, token] = authHeader.split(" ");
        if (scheme?.toLowerCase() !== "bearer" || !token) {
            throw createError({
                statusCode: 401,
                statusMessage: "Unauthorized",
                message: "Invalid token format"
            });
        }
        const decoded = verifyToken(token);

        if (!decoded) {
            throw createError({
                statusCode: 401,
                statusMessage: "Unauthorized",
                message: "Invalid or expired token"
            });
        }

        const decodedUserId = Number(decoded.userId);
        if (!Number.isInteger(decodedUserId) || decodedUserId <= 0) {
            throw createError({
                statusCode: 401,
                statusMessage: "Unauthorized",
                message: "Invalid token payload",
            });
        }

        const storedUser = await prisma.user.findUnique({
            where: {
                id: decodedUserId,
            },
            select: {
                id: true,
                role: true,
                status: true,
            },
        });
        const authentication = resolveAuthenticatedUser({
            decoded,
            user: storedUser,
        });

        if (!authentication.allowed || !authentication.user) {
            throw createError({
                statusCode: authentication.reason === "account_disabled" ? 403 : 401,
                statusMessage: authentication.reason === "account_disabled"
                    ? "Account Disabled"
                    : "Unauthorized",
                message: authentication.reason === "account_disabled"
                    ? "账号已被禁用"
                    : "登录状态已失效，请重新登录",
            });
        }

        const user = authentication.user;

        // 检查管理员权限
        if (isAdminRoute && user.role !== "admin") {
            throw createError({
                statusCode: 403,
                statusMessage: "Access denied",
                message: "Admin privileges required"
            });
        }

        // 为管理员API设置no-cache头，确保数据实时性
        if (isAdminRoute) {
            setHeader(event, 'Cache-Control', 'no-cache, no-store, must-revalidate');
            setHeader(event, 'Pragma', 'no-cache');
            setHeader(event, 'Expires', '0');
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
