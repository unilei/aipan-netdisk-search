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
    iv: '4ccfd90fd778ad0d284b6c6e182063f0',
    key: '1cc5d119477a952d96e63d2a92cb4b188eb4189c758be1fb648caeae9cfc08eb',
    encryptedData: '0a2471511ba2e5ed3b5c4daa6ec0bae30d295361d47455731675d39b09ecdcbc'
}

const getApiEndpoints = (baseUrl: string, searchTerm: string): ApiEndpoint[] => [
    {
        url: `${baseUrl}/v/api/getJuzi`,
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
