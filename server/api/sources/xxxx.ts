import { H3Event } from 'h3'
import {
    executeApiRequests
} from '~/server/utils/aipan'
import type {
    SearchBody,
    TransformedResult,
    ApiEndpoint
} from '~/server/utils/aipan'

const getApiEndpoints = (baseUrl: string, searchTerm: string): ApiEndpoint[] => [
    {
        url: `${baseUrl}/v/api/sortWeb`,
        append: {
            tabN: "movie_test",
            topNo: 10,
            whr: `question like "%${searchTerm}%"`,
            orderBy: "isTop DESC, date_time",
            orderType: "DESC",
            keys: "question,answer,isTop,id",
            searchKey: searchTerm
        },
        priority: 1
    },
    {
        url: `${baseUrl}/v/api/getGGang`,
        append: {},
        priority: 2
    },
    {
        url: `${baseUrl}/v/api/getTop`,
        append: {},
        priority: 2
    },
    {
        url: `${baseUrl}/v/api/getTTZJB`,
        append: {},
        priority: 1
    },
    {
        url: `${baseUrl}/v/api/getGirls`,
        append: {},
        priority: 1
    },
    {
        url: `${baseUrl}/v/api/getXiaoy`,
        append: {},
        priority: 1
    }
]

export default defineEventHandler(async (event: H3Event): Promise<TransformedResult> => {
    try {
        const body = await readBody<SearchBody>(event)
        if (!body?.name?.trim()) {
            throw new Error('Search term is required')
        }
        const baseUrl = "http://ssr021.cn"
        const token = "i69"
        const apiEndpoints = getApiEndpoints(baseUrl, body.name)
        return await executeApiRequests(apiEndpoints, body, token)

    } catch (error) {
        return {
            list: [],
            code: 500,
            msg: 'Internal server error'
        }
    }
})
