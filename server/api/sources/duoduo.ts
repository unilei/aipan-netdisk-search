import { H3Event } from 'h3'
import { $fetch } from 'ofetch'
import { extractLinks } from '~/server/utils/aipan'
import type {
    SearchBody,
    TransformedResult,
    TransformedItem
} from '~/server/utils/aipan'
import { getSearchModerationFailure } from '~/server/utils/sourceModeration'

interface ApiResponse {
    source: string;
    data?: Array<{
        id: string;
        title: string;
        content: string;
    }>;
    message?: string;
}

const SEARCH_URLS = [
    'https://m.duoduopuzi.cn/mv/api/crawler/search',
    'https://asd.kks021.cn/mv/api/crawler/search'
]

// 获取真实的token
function getAuthToken(searchTerm: string): string {
    // 根据前端代码分析，token生成逻辑如下：
    // 1. 获取当前时间戳
    // 2. 将搜索词和时间戳组合成字符串 `${searchTerm}:${timestamp}`
    // 3. 对这个字符串进行URL编码
    // 4. 然后使用Base64编码
    const timestamp = Date.now()
    const tokenData = encodeURIComponent(`${searchTerm}:${timestamp}`)
    const token = Buffer.from(tokenData).toString('base64')
    
    return token
}

const fetchDuoduoEndpoint = async (
    searchUrl: string,
    searchTerm: string,
    token: string
) => {
    const urlObj = new URL(searchUrl)
    const origin = `${urlObj.protocol}//${urlObj.hostname}`

    return await $fetch<ApiResponse[]>(searchUrl, {
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Referer': `${origin}/?q=${encodeURIComponent(searchTerm)}&token=${token}&page=1`,
            'Origin': origin,
            'X-Api-Key': token
        },
        params: {
            name: searchTerm
        },
        timeout: 15000
    })
}

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
        const searchTerm = body?.name?.trim()
       
        if (!searchTerm) {
            throw new Error('Search term is required')
        }

        const moderationFailure = await getSearchModerationFailure(searchTerm)
        if (moderationFailure) {
            return moderationFailure
        }
        
        const token = getAuthToken(searchTerm)

        try {
            const settled = await Promise.allSettled(
                SEARCH_URLS.map((searchUrl) =>
                    fetchDuoduoEndpoint(searchUrl, searchTerm, token)
                )
            )
            const responses = settled
                .filter((result): result is PromiseFulfilledResult<ApiResponse[]> =>
                    result.status === 'fulfilled' && Array.isArray(result.value)
                )
                .flatMap((result) => result.value)

            if (responses.length === 0) {
                const firstError = settled.find(
                    (result): result is PromiseRejectedResult => result.status === 'rejected'
                )
                return {
                    list: [],
                    code: 502,
                    msg: firstError?.reason?.message || 'All Duoduo upstreams failed to respond'
                }
            }

            return processApiResponse(responses, searchTerm)
        } catch (error) {
            console.error('API调用失败:', error)
            return {
                list: [],
                code: 500,
                msg: 'Internal server error'
            }
        }
    } catch (error) {
        console.error('搜索过程中出错:', error)
        return {
            list: [],
            code: 500,
            msg: 'Internal server error'
        }
    }
})

// 处理API响应数据
function processApiResponse(responseData: ApiResponse[], searchTerm: string): TransformedResult {
    const results: TransformedItem[] = []
    const seen = new Set<string>()
    const searchTermLower = searchTerm.toLowerCase()
    
    // 处理每个来源的数据
    for (const source of responseData) {
        // 跳过没有数据或有错误信息的来源
        if (!source.data || source.message) {
            continue
        }
        
        // 处理每个数据项
        for (const item of source.data) {
            // 确保title包含关键词，如果没有title或不包含关键词，则创建一个包含关键词的title
            let title = item.title || ''
            if (!title || !title.toLowerCase().includes(searchTermLower)) {
                // 从content中提取可能的标题
                const contentLines = (item.content || '').split('\n')
                const firstLine = contentLines[0] || ''
                
                // 如果第一行包含关键词，使用它作为标题
                if (firstLine.toLowerCase().includes(searchTermLower)) {
                    title = firstLine
                } else {
                    // 否则创建一个包含关键词的标题
                    title = `${searchTerm} - ${source.source}`
                }
            }
            
            const content = item.content || ''
            
            // 提取链接
            const links = extractLinks(content)
             
            if (links.length > 0) {
                const dedupeKey = `${title}|${links.map(link => link.link).join('|')}`
                if (seen.has(dedupeKey)) {
                    continue
                }
                seen.add(dedupeKey)
                results.push({
                    name: title,
                    links
                })
            }
        }
    }

    return {
        list: results,
        code: results.length > 0 ? 200 : 404,
        msg: results.length > 0 ? undefined : 'No results found'
    }
}
