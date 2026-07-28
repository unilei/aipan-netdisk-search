import prisma from "~/lib/prisma";
import { syncResource } from "~/server/services/search/elasticsearchClient.js";
import { requireAdmin } from "~/server/utils/auth";

export default defineEventHandler(async (event) => {
    const user = await requireAdmin(event);
    const body = await readBody(event);
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const typeId = Number(body?.typeId);

    if (!name || name.length > 255 || !Number.isInteger(typeId) || typeId <= 0) {
        throw createError({
            statusCode: 400,
            message: "资源名称或类型无效",
        });
    }

    let parsedLinks: unknown;
    try {
        parsedLinks = typeof body?.links === "string"
            ? JSON.parse(body.links)
            : body?.links;
    } catch {
        throw createError({
            statusCode: 400,
            message: "资源链接格式无效",
        });
    }

    if (!Array.isArray(parsedLinks) || parsedLinks.length === 0 || parsedLinks.length > 20) {
        throw createError({
            statusCode: 400,
            message: "资源链接格式无效",
        });
    }

    const normalizedLinks = parsedLinks.map((entry: any, index: number) => {
        const value = typeof entry?.value === "string" ? entry.value.trim() : "";
        let parsedUrl: URL;

        try {
            parsedUrl = new URL(value);
        } catch {
            throw createError({
                statusCode: 400,
                message: "资源链接格式无效",
            });
        }

        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
            throw createError({
                statusCode: 400,
                message: "资源链接仅支持 HTTP 或 HTTPS",
            });
        }

        return {
            key: entry?.key ?? `${Date.now()}-${index}`,
            value: parsedUrl.toString(),
        };
    });

    const resourceType = await prisma.resourceType.findFirst({
        where: {
            id: typeId,
            isEnabled: true,
        },
        select: {
            id: true,
        },
    });

    if (!resourceType) {
        throw createError({
            statusCode: 400,
            message: "资源类型不存在或已停用",
        });
    }

    try {
        const resource = await prisma.resource.create({
            data: {
                name,
                links: JSON.stringify(normalizedLinks),
                typeId,
                creatorId: user.userId,
            },
            include: {
                creator: { select: { username: true } },
                type: { select: { name: true } },
            }
        })

        try {
            await syncResource(resource);
        } catch (esError) {
            console.error("同步资源到 ES 失败:", esError);
        }

        return {
            code: 200,
            msg: 'success',
            data: resource
        }
    } catch (error) {
        console.error('创建资源失败:', error)
        if ((error as any)?.statusCode) {
            throw error;
        }
        throw createError({
            statusCode: 500,
            message: '创建资源失败'
        })
    }
})
