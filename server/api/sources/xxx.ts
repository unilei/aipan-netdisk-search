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
        url: `${baseUrl}/v/api/getJuzi`,
        append: {},
        priority: 2
    },
    {
        url: `${baseUrl}/v/api/getDJ`,
        append: {},
        priority: 2
    },
    {
        url: `${baseUrl}/v/api/getXiaoyu`,
        append: {},
        priority: 2
    },
    {
        url: `${baseUrl}/v/api/search`,
        append: {},
        priority: 1
    },
    {
        url: `${baseUrl}/v/api/getSearchX`,
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
        const baseUrl = "http://y.kkkob.com"
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
