import { H3Event } from 'h3'
import { encrypt,decrypt } from "~/utils/tools"
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
    iv: '901ff7d22cd1ddb2ed65ba86248145ad',
    key: '5516ed9c11ea4ac872c3da09a83be841b4d60ecd94a9007a85a962a9dda01957',
    encryptedData: '9f53109a927abbbafe5c7cd79774d46f55613ef21e140528423867daaac83150'
}

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
