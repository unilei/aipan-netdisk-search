import { verifyToken } from '~/server/model/user'
import {
    getUserResourceSearchIndexName,
    listIndexedUserResources,
} from "~/server/services/search/elasticsearchClient.js";

const toPositiveInt = (value: unknown, fallback: number) => {
    const parsed = Number.parseInt(String(value || ''), 10)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export default defineEventHandler(async (event) => {
    const token = getHeader(event, 'authorization')?.split(' ')[1]
    const user = token ? verifyToken(token) : null

    if (!user || user.role !== 'admin') {
        throw createError({
            statusCode: 403,
            message: '无权限访问'
        })
    }

    const query = getQuery(event)
    const page = toPositiveInt(query.page, 1)
    const pageSize = Math.min(toPositiveInt(query.pageSize, 20), 100)
    const search = typeof query.search === 'string' ? query.search.trim() : ''

    try {
        const result = await listIndexedUserResources({
            page,
            pageSize,
            search
        })
        const data = result.documents.map((item) => ({
            documentId: item.documentId,
            score: item.score,
            ...item.document
        }))

        return {
            code: 200,
            data,
            index: {
                name: getUserResourceSearchIndexName()
            },
            pagination: {
                page,
                pageSize,
                total: result.total,
                totalPages: Math.ceil(result.total / pageSize)
            }
        }
    } catch (error) {
        console.error('获取用户投稿搜索索引失败:', error)
        throw createError({
            statusCode: 500,
            message: '获取用户投稿搜索索引失败'
        })
    }
})
