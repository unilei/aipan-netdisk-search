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
        // Check domain access restriction
        const host = getRequestHeader(event, 'host') || '';
        const referer = getRequestHeader(event, 'referer') || '';

        const isValidDomain = host.endsWith('aipan.me') ||
            referer.includes('aipan.me') || host.includes('localhost');

        if (!isValidDomain) {
            return {
                list: [],
                code: 403,
                msg: 'Access denied - domain restriction',
            };
        }

        // Check user authentication
        const authHeader = getRequestHeader(event, 'authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return {
                list: [],
                code: 401,
                msg: 'Authentication required',
            };
        }

        const authToken = authHeader.split(' ')[1];
        if (!authToken) {
            return {
                list: [],
                code: 401,
                msg: 'Invalid authentication token',
            };
        }

        // Verify token
        try {
            const { verifyToken } = await import('~/server/model/user');
            const user = verifyToken(authToken);
            if (!user) {
                return {
                    list: [],
                    code: 401,
                    msg: 'Invalid or expired token',
                };
            }
        } catch (error) {
            return {
                list: [],
                code: 401,
                msg: 'Authentication failed',
            };
        }

        const body = await readBody<SearchBody>(event)
        if (!body?.name?.trim()) {
            throw new Error('Search term is required')
        }

        const baseUrl = "http://m.kkqws.com"

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
