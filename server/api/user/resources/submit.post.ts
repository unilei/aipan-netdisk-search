import prisma from "~/lib/prisma";
import { verifyToken } from "~/server/model/user";

export default defineEventHandler(async (event) => {
    try {
        // 验证 token
        const authHeader = event.node.req.headers["authorization"];
        if (!authHeader) {
            throw createError({
                statusCode: 401,
                message: "No authorization header"
            });
        }

        const token = authHeader.split(" ")[1];
        const user = await verifyToken(token);
        if (!user) {
            throw createError({
                statusCode: 401,
                message: "Invalid token"
            });
        }

        const body = await readBody(event);
        const { name, links, description } = body;

        // 验证必填字段
        if (!name?.trim() || !links || !description?.trim()) {
            throw createError({
                statusCode: 400,
                message: "请填写完整的资源信息"
            });
        }

        // 创建用户资源投稿
        const resource = await prisma.userResource.create({
            data: {
                name,
                links,
                description,
                creatorId: user.userId || user.id,
                status: 'pending' // 默认为待审核状态
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        username: true,
                        email: true
                    }
                }
            }
        });

        return {
            code: 200,
            msg: "投稿成功，等待审核",
            data: resource
        };
    } catch (error: any) {
        console.error('资源投稿失败:', error);
        throw createError({
            statusCode: error.statusCode || 500,
            message: error.message || "服务器错误"
        });
    }
}); 