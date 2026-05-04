import prisma from "~/lib/prisma";
import {
    mapStoredResourceToSourceItem,
    mapUserResourceDocumentToSourceItem,
    mergeSourceItems,
    normalizeSource1SearchName,
} from "~/server/services/search/source1Results.js";
import {
    searchPublishedUserResources,
    getOptionalResourceSearchClient,
    searchResources,
} from "~/server/services/search/elasticsearchClient.js";

interface Body {
    name: string
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

        // Determine whether ES is available for the resources index
        const esResourceClient = getOptionalResourceSearchClient();

        const [primaryResults, publishedUserResources] = await Promise.all([
            // Main resource search: ES if available, Prisma as fallback
            esResourceClient
                ? searchResources(nameFilter, maxResults).catch((error) => {
                    console.error("搜索资源 ES 索引失败，回退到 Prisma:", error);
                    return null; // signal fallback
                })
                : null,
            // User-contributed resources: always via ES (returns [] if not configured)
            searchPublishedUserResources(nameFilter, maxResults).catch((error) => {
                console.error("搜索用户投稿 ES 索引失败:", error);
                return [];
            }),
        ]);

        let localResults;
        if (primaryResults !== null) {
            // ES path succeeded
            localResults = primaryResults.map((document: any) =>
                mapUserResourceDocumentToSourceItem(document)
            );
        } else {
            // Prisma fallback
            const res = await prisma.resource.findMany({
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
            });
            localResults = res.map((item) => mapStoredResourceToSourceItem(item));
        }

        const userResourceResults = (publishedUserResources as any[]).map((document: any) =>
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
