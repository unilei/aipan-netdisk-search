import { H3Event } from 'h3'
import { $fetch } from 'ofetch'
import type {
    SearchBody,
    TransformedResult,
    TransformedItem,
    Link
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
        
        // 获取真实的token
        const token = getAuthToken(searchTerm)
        console.log('获取到token:', token)
        
        // 根据前端代码分析，正确的API调用方式
        try {
            // 随机选择一个URL
            const searchUrls = [
                'https://m.duoduopuzi.cn/mv/api/crawler/search',
                'https://asd.kks021.cn/mv/api/crawler/search'
            ]
            const searchUrl = searchUrls[Math.floor(Math.random() * searchUrls.length)]
            if (!searchUrl) {
                throw new Error('No search URL available')
            }
            console.log('选择的搜索URL:', searchUrl)
            
            // 提取域名部分作为Origin和Referer
            const urlObj = new URL(searchUrl)
            const origin = `${urlObj.protocol}//${urlObj.hostname}`
            
            const responseData = await $fetch<ApiResponse[]>(searchUrl, {
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
                }
            })
            
            console.log('API响应成功，处理数据...')
            return processApiResponse(responseData, searchTerm)
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
                results.push({
                    name: title,
                    links
                })
            }
        }
    }
    
    console.log(`总共找到 ${results.length} 个结果`)
    
    return {
        list: results,
        code: results.length > 0 ? 200 : 404,
        msg: results.length > 0 ? undefined : 'No results found'
    }
}

// 从内容中提取链接
function extractLinks(content: string): Link[] {
    const links: Link[] = []
    const urlRegex = /https?:\/\/[^\s]+/g
    const codeRegex = /提取码[:\：]\s*([a-zA-Z0-9]+)/
    
    // 检查HTML链接
    const htmlLinkRegex = /<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g
    let htmlMatch
    while ((htmlMatch = htmlLinkRegex.exec(content)) !== null) {
        const url = htmlMatch[1]
        const linkText = htmlMatch[2]
        
        // 跳过没有URL的匹配
        if (!url) continue
        
        // 根据URL或链接文本确定服务类型
        let service: Link['service'] = 'OTHER'
        let pwd: string | undefined = undefined
        
        if (url.includes('pan.baidu.com') || (linkText && linkText.includes('百度'))) {
            service = 'BAIDU'
        } else if (url.includes('pan.xunlei.com') || (linkText && linkText.includes('迅雷'))) {
            service = 'XUNLEI'
        } else if (url.includes('pan.quark.cn') || (linkText && linkText.includes('夸克'))) {
            service = 'QUARK'
        } else if (url.includes('aliyundrive.com') || url.includes('alipan.com') || (linkText && linkText.includes('阿里'))) {
            service = 'ALIYUN'
        }
        
        links.push({
            service,
            link: url,
            pwd
        })
    }
    
    // 同时检查纯文本URL
    const lines = content.split('\n')
    
    for (const line of lines) {
        const urlMatches = line.match(urlRegex)
        if (!urlMatches || urlMatches.length === 0) continue
        
        // 跳过已经作为HTML链接处理过的URL
        const url = urlMatches[0]
        if (links.some(link => link.link === url)) continue
        
        const codeMatch = line.match(codeRegex)
        const extractionCode = codeMatch ? codeMatch[1] : undefined
        
        // 根据URL确定服务类型
        let service: Link['service'] = 'OTHER'
        
        if (url.includes('pan.baidu.com')) {
            service = 'BAIDU'
        } else if (url.includes('pan.xunlei.com')) {
            service = 'XUNLEI'
        } else if (url.includes('pan.quark.cn')) {
            service = 'QUARK'
        } else if (url.includes('aliyundrive.com') || url.includes('alipan.com')) {
            service = 'ALIYUN'
        }
        
        links.push({
            service,
            link: url,
            pwd: extractionCode
        })
    }
    
    return links
}
