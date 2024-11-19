import { LRUCache } from 'lru-cache';
import { $fetch } from 'ofetch'
import { decrypt } from "~/utils/tools"

// Types
export type Result = {
    list: Array<Record<string, any>>
    code?: number
    msg?: string
}

export type SearchBody = {
    name: string
}

export type Link = {
    service: 'BAIDU' | 'XUNLEI' | 'QUARK' | 'ALIYUN' | 'OTHER'
    link: string
    pwd?: string
}

export type TransformedItem = {
    name: string
    links: Link[]
}

export type TransformedResult = {
    list: TransformedItem[]
    code?: number
    msg?: string
}

export type Token = {
    token: string
    user: Array<any>
    timestamp?: number
}

export type ApiEndpoint = {
    url: string
    append?: Record<string, any>
    priority?: number
}

// Constants
export const CACHE_CONFIG = {
    TTL: 5 * 60 * 1000, // 5 minutes
    MAX_SIZE: 100,
    MAX_RETRIES: 2,
    RETRY_DELAY: 1000
}

export const SERVICE_DOMAINS: Record<Link['service'], string | string[]> = {
    BAIDU: 'pan.baidu.com',
    XUNLEI: 'pan.xunlei.com',
    QUARK: 'pan.quark.cn',
    ALIYUN: ['www.aliyundrive.com', 'www.alipan.com'],
    OTHER: ''
} as const

// Cache initialization
export const searchCache = new LRUCache<string, Result>({
    max: CACHE_CONFIG.MAX_SIZE,
    ttl: CACHE_CONFIG.TTL,
    updateAgeOnGet: true,
    sizeCalculation: (value) => JSON.stringify(value).length,
    maxSize: 5 * 1024 * 1024
})

// Utility functions
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const fetchWithRetry = async <T>(url: string, options: any, retries = CACHE_CONFIG.MAX_RETRIES): Promise<T> => {
    try {
        const response = await $fetch<T>(url, {
            method: 'POST',
            body: options
        })
        return response
    } catch (error: any) {
        if (retries > 0 && (error.status === 502 || error.status === 503 || error.status === 504)) {
            console.warn(`Retrying failed request to ${url}, ${retries} attempts remaining`)
            await sleep(CACHE_CONFIG.RETRY_DELAY)
            return fetchWithRetry<T>(url, options, retries - 1)
        }
        throw error
    }
}

export const fetchApi = async (url: string, body: SearchBody, token: string, append: Record<string, any> = {}): Promise<Result> => {
    try {
        const cacheKey = `${url}_${JSON.stringify(body)}_${JSON.stringify(append)}`
        
        const cachedResult = searchCache.get(cacheKey)
        if (cachedResult) {
            return cachedResult
        }

        const response = await fetchWithRetry<any>(url, {
            ...body,
            ...append,
            token
        })

        // console.log('API Response Structure:', {
        //     url: url,
        //     hasData: !!response?.data,
        //     hasDataList: !!response?.data?.list,
        //     hasList: !!response?.list,
        //     isArray: Array.isArray(response),
        //     responseType: typeof response,
        //     response: JSON.stringify(response, null, 2)
        // })

        // Handle different response formats
        let result: Result
        if (response?.data?.list) {
            // Response has data wrapper
            result = {
                list: response.data.list,
                code: response.data.code,
                msg: response.data.msg
            }
        } else if (Array.isArray(response?.list)) {
            // Direct list in response
            result = {
                list: response.list,
                code: response.code,
                msg: response.msg
            }
        } else if (Array.isArray(response)) {
            // Response is an array
            result = {
                list: response,
                code: 200
            }
        } else if (response?.data && typeof response.data === 'object') {
            // Response is an object in data field
            result = {
                list: [response.data],
                code: response.status || 200
            }
        } else if (typeof response === 'object' && response !== null) {
            // Direct object response
            result = {
                list: [response],
                code: 200
            }
        } else {
            // Invalid response format
            throw new Error(`Invalid response format: ${JSON.stringify(response)}`)
        }

        if (result.list.length > 0) {
            searchCache.set(cacheKey, result)
        }

        return result
    } catch (error: any) {
        console.error(`API request failed for ${url}:`, {
            error: error.message,
            response: error.response?.data,
            status: error.response?.status,
            fullError: error
        })
        throw error
    }
}

export const extractLinks = (answer: string | undefined): Link[] => {
    if (!answer?.trim()) return []

    const urlRegex = /https?:\/\/[^\s]+/g
    const codeRegex = /提取码[:：]\s*([a-zA-Z0-9]+)/

    const serviceChecks = Object.entries(SERVICE_DOMAINS).map(([service, domain]) => ({
        service,
        check: Array.isArray(domain)
            ? (url: string) => domain.some(d => url.includes(d))
            : (url: string) => url.includes(domain)
    }))

    return answer.split('\n').reduce<Link[]>((acc, answerLine) => {
        const urls = answerLine.match(urlRegex)
        const url = urls?.[0]
        if (!url) return acc

        const codeMatch = answerLine.match(codeRegex)
        const service = serviceChecks.find(({ check }) => check(url))?.service as Link['service'] || 'OTHER'

        acc.push({
            service,
            link: url,
            pwd: codeMatch?.[1]
        })
        return acc
    }, [])
}

export const executeApiRequests = async (
    apiEndpoints: ApiEndpoint[],
    body: SearchBody,
    token: string,
    batchSize = 3
): Promise<TransformedResult> => {
    const results: Result[] = []
    const errors: Array<{ url: string, error: any }> = []
    let hasValidResponse = false

    // Sort endpoints by priority
    const sortedEndpoints = [...apiEndpoints].sort((a, b) => (a.priority || 99) - (b.priority || 99))

    // Execute in batches
    for (let i = 0; i < sortedEndpoints.length; i += batchSize) {
        const batch = sortedEndpoints.slice(i, i + batchSize)
        const batchPromises = batch.map(async endpoint => {
            try {
                const result = await fetchApi(endpoint.url, body, token, endpoint.append || {})
                if (result.list?.length > 0) {
                    results.push(result)
                    hasValidResponse = true
                }
            } catch (error: any) {
                const errorMessage = error.response?.data?.msg || 
                                   error.response?.msg || 
                                   error.message || 
                                   'Unknown error'
                errors.push({ 
                    url: endpoint.url, 
                    error: errorMessage 
                })
                console.error(`Failed to fetch from ${endpoint.url}:`, {
                    message: errorMessage,
                    response: error.response,
                    error
                })
            }
        })
        
        await Promise.all(batchPromises)
        
        // If we have valid responses from high-priority endpoints, we can stop
        if (hasValidResponse && i < batchSize) {
            break
        }
    }

    // Transform results
    const transformedList = results
        .flatMap(response => response.list || [])
        .filter(item => item?.question)
        .map(item => ({
            name: item.question,
            links: extractLinks(item.answer)
        }))

    const errorMessages = errors.map(e => {
        const pathname = new URL(e.url).pathname
        return `${pathname}: ${e.error}`
    }).join('; ')
    
    return {
        list: transformedList,
        code: transformedList.length > 0 ? 200 : (errors.length === apiEndpoints.length ? 500 : 206),
        msg: errors.length > 0 ? 
            `${errors.length} of ${apiEndpoints.length} requests failed (${errorMessages})` : 
            (transformedList.length === 0 ? 'No results found' : undefined)
    }
}
