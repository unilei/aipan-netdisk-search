import { H3Event } from 'h3'
import { decrypt } from "~/utils/tools"
import {
    executeApiRequests
} from '~/server/utils/aipan'
import type {
    SearchBody,
    TransformedResult,
    ApiEndpoint,
    Token
} from '~/server/utils/aipan'

// Constants
const DECRYPT_CONFIG = {
    iv: 'da128718bfbf504e6df43bc8e77f00e5',
    key: '2e9096e311ab53f32776f87f669dbf9b04e2e4a12cd10db47b8d814ff7af605b',
    encryptedData: 'ee7b334d32778411441fdf6e891e51d4143558b6027a0b06a45f4e1fe9a9d137'
}

const getApiEndpoints = (baseUrl: string, searchTerm: string): ApiEndpoint[] => [
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
        append: {
            topNo: 10,
            keys: "question,answer,isTop,id",
            searchKey: searchTerm
        },
        priority: 2
    },
    {
        url: `${baseUrl}/api/getXiaoy`,
        append: {
            topNo: 10,
            keys: "question,answer,isTop,id",
            searchKey: searchTerm
        },
        priority: 3
    },
    {
        url: `${baseUrl}/api/getDyfx`,
        append: {
            topNo: 10,
            keys: "question,answer,isTop,id",
            searchKey: searchTerm
        },
        priority: 3
    },
    {
        url: `${baseUrl}/api/getTTZJB`,
        append: {
            topNo: 10,
            keys: "question,answer,isTop,id",
            searchKey: searchTerm
        },
        priority: 3
    }
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

        const rawUrl = decrypt(DECRYPT_CONFIG)
        if (!rawUrl) {
            throw new Error('Failed to decrypt API base URL')
        }
     
        // Ensure base URL ends with /v
        const baseUrl = rawUrl.endsWith('/v') ? rawUrl : `${rawUrl}/v`
        console.log('Base URL:', baseUrl)

        // Get token
        const tokenUrl = `${baseUrl}/api/gettoken`
        console.log('Fetching token from:', tokenUrl)
        try {
            const tokenResponse = await $fetch<Token>(tokenUrl, {
                method: 'GET'
            })
            console.log('Token response:', tokenResponse)
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
            console.error('Token fetch failed:', {
                url: tokenUrl,
                error: error.message,
                response: error.response?.data,
                status: error.response?.status
            })
            throw new Error(`Failed to get token: ${error.message}`)
        }
    } catch (error: any) {
        console.error('Search failed:', error)
        return {
            list: [],
            code: 500,
            msg: error.message || 'Internal server error'
        }
    }
})
