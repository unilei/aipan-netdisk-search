import prisma from "~/lib/prisma";
import {
    mapStoredResourceToSourceItem,
    mapUserResourceDocumentToSourceItem,
    mergeSourceItems,
    normalizeSource1SearchName,
} from "~/server/services/search/source1Results.js";
import { searchPublishedUserResources } from "~/server/services/search/elasticsearchClient.js";
interface Body {
    name: string
}

interface Item {
    name: string
    creator: {
        username: string
    }
    type: {
        name: string
    },
    typeId: number,
    createdAt: Date,
    updatedAt: Date,
    id: number,
    links: string
}
export default defineEventHandler(async (event) => {
    const body: Body = await readBody(event);

    try {
        const nameFilter = normalizeSource1SearchName(body);

        if (!nameFilter) {
            return {
                list: [],
                code: 200
            };
        }

        const maxResults = 50;

        const [res, publishedUserResources] = await Promise.all([
            prisma.resource.findMany({
                where: {
                    name: {
                        contains: nameFilter,
                        mode: 'insensitive',
                    },
                },
                select: {
                    id: true,
                    name: true,
                    links: true,
                    typeId: true,
                    createdAt: true,
                    updatedAt: true,
                    creator: {
                        select: { username: true },
                    },
                    type: {
                        select: { name: true },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: maxResults,
            }),
            searchPublishedUserResources(nameFilter, maxResults).catch((error) => {
                console.error("搜索用户投稿 ES 索引失败:", error);
                return [];
            }),
        ]);

        const localResults = res.map((item) => mapStoredResourceToSourceItem(item));
        const userResourceResults = publishedUserResources.map((document: any) =>
            mapUserResourceDocumentToSourceItem(document)
        );
        const result = mergeSourceItems(localResults, userResourceResults, maxResults);

        return {
            list: result,
            code: 200
        };

    } catch (e) {
        console.error("搜索资源失败:", e);

        return {
            code: 500,
            msg: 'An error occurred while searching for resources',
            list: []
        };
    }
});
