import { H3Event } from 'h3'
import { decrypt } from "~/utils/tools"
import {
    executeApiRequests
} from '~/server/utils/aipan'
import type {
    SearchBody,
    TransformedResult,
    ApiEndpoint
} from '~/server/utils/aipan'


// Constants
const DECRYPT_CONFIG = {
    iv: '8477333f511b3602eab6248d45154bcf',
    key: 'e75c4cf24b5f4e364b97f8189fed04fe4c08fa052a93e3e6db7728ca253e28f4',
    encryptedData: '3525b9f09bfe5dbd203dd64391a0c13c5f87e3516fb13da030a3d53471114d1d'
}

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
    {   url: `${baseUrl}/v/api/getXiaoy`,
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

        const baseUrl = decrypt(DECRYPT_CONFIG)
        // console.log('API Base URL:', baseUrl)
        if (!baseUrl) {
            throw new Error('Failed to decrypt API base URL')
        }

        const token = "i69" // TODO: Implement proper token management if needed

        const apiEndpoints = getApiEndpoints(baseUrl, body.name)
        return await executeApiRequests(apiEndpoints, body, token)

    } catch (error) {
        console.error('API Error:', error)
        return {
            list: [],
            code: 500,
            msg: error instanceof Error ? error.message : 'Internal server error'
        }
    }
})
