import { LRUCache } from 'lru-cache';
import { $fetch } from 'ofetch'

// Types
export type Result = {
    list: Array<Record<string, any>>
    code?: number
    msg?: string
}

export type SearchBody = {
    name: string
}

export type LinkService =
    | 'BAIDU'
    | 'XUNLEI'
    | 'QUARK'
    | 'ALIYUN'
    | 'UC'
    | 'TIANYI'
    | 'MOBILE'
    | '115'
    | 'PIKPAK'
    | '123'
    | 'MAGNET'
    | 'ED2K'
    | 'OTHER'

export type Link = {
    service: LinkService
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

export const SERVICE_DOMAINS: Record<LinkService, readonly string[]> = {
    BAIDU: ['pan.baidu.com'],
    XUNLEI: ['pan.xunlei.com'],
    QUARK: ['pan.quark.cn'],
    ALIYUN: ['aliyundrive.com', 'alipan.com'],
    UC: ['drive.uc.cn'],
    TIANYI: ['cloud.189.cn'],
    MOBILE: ['yun.139.com', 'caiyun.139.com'],
    '115': ['115cdn.com', '115.com'],
    PIKPAK: ['mypikpak.com', 'toapp.mypikpak.com'],
    '123': ['123684.com', '123865.com', '123912.com', '123pan.com', '123pan.cn'],
    MAGNET: ['magnet:?'],
    ED2K: ['ed2k://'],
    OTHER: []
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
        throw error
    }
}

const normalizeExtractedUrl = (rawUrl: string) =>
    rawUrl
        .replace(/&amp;/g, '&')
        .trim()
        .split(/(?:提取码|访问码|密[码碼])[:：]/i)[0]
        .replace(/[)\]】。；;,，]+$/g, '')
        .trim()

const extractPassword = (line: string, url: string) => {
    const fromUrl = url.match(/[?&](?:pwd|password)=([a-zA-Z0-9]+)/i)?.[1]
    if (fromUrl) return fromUrl

    return line.match(/(?:提取码|访问码|密[码碼])[:：]?\s*([a-zA-Z0-9]+)/i)?.[1]
}

export const detectLinkService = (url: string): LinkService => {
    const normalizedUrl = url.toLowerCase()
    const service = Object.entries(SERVICE_DOMAINS)
        .filter(([, domains]) => domains.length > 0)
        .find(([, domains]) => domains.some(domain => normalizedUrl.includes(domain)))
        ?.[0] as LinkService | undefined

    return service || 'OTHER'
}

export const extractLinks = (answer: string | undefined): Link[] => {
    if (!answer?.trim()) return []

    const urlRegex = /(?:https?:\/\/[^\s<>"']+|magnet:\?[^\s<>"']+|ed2k:\/\/[^\s<>"']+)/gi
    const seen = new Set<string>()

    return answer.split('\n').reduce<Link[]>((acc, answerLine) => {
        const urls = answerLine.match(urlRegex) || []
        urls.forEach(rawUrl => {
            const url = normalizeExtractedUrl(rawUrl)
            if (!url || seen.has(url)) return

            seen.add(url)
            acc.push({
                service: detectLinkService(url),
                link: url,
                pwd: extractPassword(answerLine, url)
            })
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
        .filter(item => item.links.length > 0)

    const errorMessages = errors.map(e => {
        const pathname = new URL(e.url).pathname
        return `${pathname}: ${e.error}`
    }).join('; ')

    if (errorMessages) {
        console.warn(errorMessages)
    }

    return {
        list: transformedList,
        code: transformedList.length > 0 ? 200 : (errors.length === apiEndpoints.length ? 500 : 206),
        msg: errors.length > 0 ?
            `${errors.length} of ${apiEndpoints.length} requests failed ` :
            (transformedList.length === 0 ? 'No results found' : undefined)
    }
}
