import { H3Event } from 'h3'
import {
    executeApiRequests
} from '~/server/utils/aipan'
import type {
    SearchBody,
    TransformedResult,
    ApiEndpoint,
    Token
} from '~/server/utils/aipan'

const getApiEndpoints = (baseUrl: string, searchTerm: string): ApiEndpoint[] => [
    {
        url: `${baseUrl}/api/getJuzi`,
        priority: 1
    },
    {
        url: `${baseUrl}/api/sortWeb`,
        append: {
            tabN: "movie_200317xlb",
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
        url: `${baseUrl}/api/getTop`,
        priority: 2
    },
    {
        url: `${baseUrl}/api/getDyfx`,
        priority: 3
    },
    {
        url: `${baseUrl}/api/getTTZJB`,
        priority: 3
    },
    {
        url: `${baseUrl}/api/getGirls`,
        priority: 3
    },
    {
        url: `${baseUrl}/api/getXiaoy`,
        priority: 3
    },
    {
        url: `${baseUrl}/api/getGGang`,
        priority: 3
    },
]

export default defineEventHandler(async (event: H3Event): Promise<TransformedResult> => {
    try {
        const body = await readBody<SearchBody>(event)
        if (!body?.name?.trim()) {
            return {
                list: [],
                code: 400,
                msg: "Search term is required"
            }
        }

        const rawUrl = "http://xccji.top"

        // Ensure base URL ends with /v
        const baseUrl = rawUrl.endsWith('/v') ? rawUrl : `${rawUrl}/v`

        // Get token
        const tokenUrl = `${baseUrl}/api/gettoken`

        try {
            const tokenResponse = await $fetch<Token>(tokenUrl, {
                method: 'GET'
            })

            if (!tokenResponse?.token) {
                throw new Error('Token not found in response')
            }

            // Execute API requests
            return await executeApiRequests(
                getApiEndpoints(baseUrl, body.name),
                body,
                tokenResponse.token
            )
        } catch (error: any) {
            throw new Error(`Failed to get token: ${error.message}`)
        }
    } catch (error: any) {

        return {
            list: [],
            code: 500,
            msg: 'Internal server error'
        }
    }
})
