import type { H3Event } from 'h3'
import { $fetch } from 'ofetch'

interface SearchBody {
    name: string
}

interface Link {
    service: 'BAIDU' | 'XUNLEI' | 'QUARK' | 'ALIYUN' | 'UC' | 'TIANYI' | 'MOBILE' | '115' | 'PIKPAK' | '123' | 'MAGNET' | 'ED2K' | 'OTHER'
    link: string
    pwd?: string
}

interface TransformedItem {
    name: string
    links: Link[]
}

interface TransformedResult {
    list: TransformedItem[]
    code?: number
    msg?: string
}

interface XiaokupanDocument {
    name: string
    description: string
    url: string
}

const SEARCH_BASE_URL = 'https://xiaokupan.com/s'

const DIGITAL_DOCUMENT_REGEX = /\\"@type\\":\\"DigitalDocument\\",\\"name\\":\\"((?:\\\\.|[^"\\])*)\\",\\"description\\":\\"((?:\\\\.|[^"\\])*)\\",\\"url\\":\\"((?:\\\\.|[^"\\])*)\\",\\"dateModified\\":\\"((?:\\\\.|[^"\\])*)\\"/g

const SERVICE_PATTERNS: Array<{ service: Link['service'], pattern: RegExp }> = [
    { service: 'BAIDU', pattern: /https?:\/\/pan\.baidu\.com\/s\/[A-Za-z0-9_-]+(?:\?pwd=[A-Za-z0-9]+)?/i },
    { service: 'XUNLEI', pattern: /https?:\/\/pan\.xunlei\.com\/s\/[A-Za-z0-9_-]+(?:\?pwd=[A-Za-z0-9]+)?#?/i },
    { service: 'QUARK', pattern: /https?:\/\/pan\.quark\.cn\/s\/[A-Za-z0-9]+/i },
    { service: 'ALIYUN', pattern: /https?:\/\/(?:www\.)?(?:aliyundrive|alipan)\.com\/s\/[A-Za-z0-9]+/i },
    { service: 'UC', pattern: /https?:\/\/drive\.uc\.cn\/s\/[A-Za-z0-9]+(?:\?public=1)?/i },
    { service: 'TIANYI', pattern: /https?:\/\/cloud\.189\.cn\/(?:t\/|web\/share\?code=)[^"\\\s]+/i },
    { service: 'MOBILE', pattern: /https?:\/\/(?:caiyun|yun)\.139\.com\/(?:m\/i\?|w\/i\/)[^"\\\s]+/i },
    { service: '115', pattern: /https?:\/\/115cdn\.com\/s\/[A-Za-z0-9]+(?:\?password=[A-Za-z0-9]+)?/i },
    { service: 'PIKPAK', pattern: /https?:\/\/mypikpak\.com\/s\/[^"\\\s]+/i },
    { service: '123', pattern: /https?:\/\/(?:www\.)?(?:123684|123865|123912|123pan)\.(?:com|cn)\/s\/[^?"\\\s]+/i },
    { service: 'MAGNET', pattern: /magnet:\?[^"\\\s]+/i },
    { service: 'ED2K', pattern: /ed2k:\/\/[^"\\\s]+/i }
]

const DESCRIPTION_SERVICE_MAPPING: Record<string, Link['service']> = {
    baidu: 'BAIDU',
    xunlei: 'XUNLEI',
    quark: 'QUARK',
    aliyun: 'ALIYUN',
    uc: 'UC',
    tianyi: 'TIANYI',
    mobile: 'MOBILE',
    '115': '115',
    pikpak: 'PIKPAK',
    '123': '123',
    magnet: 'MAGNET',
    ed2k: 'ED2K'
}

const decodeJsonFragment = (value: string): string => {
    try {
        return JSON.parse(`"${value}"`)
    } catch {
        return value
            .replace(/\\u0026/g, '&')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\')
    }
}

const normalizeWhitespace = (value: string): string => value.replace(/\s+/g, ' ').trim()

const normalizeTitle = (title: string): string => normalizeWhitespace(title)

const detectService = (url: string, description: string): Link['service'] => {
    const serviceMatch = SERVICE_PATTERNS.find(({ pattern }) => pattern.test(url))
    if (serviceMatch) {
        return serviceMatch.service
    }

    const descriptionLower = description.toLowerCase()
    const mappingEntry = Object.entries(DESCRIPTION_SERVICE_MAPPING)
        .find(([provider]) => descriptionLower.includes(`来自${provider}网盘`) || descriptionLower.includes(`${provider}网盘`))

    return mappingEntry?.[1] || 'OTHER'
}

const normalizeLink = (rawUrl: string): string => {
    const decodedUrl = decodeJsonFragment(rawUrl)
        .replace(/&amp;/g, '&')
        .trim()

    const matchedPattern = SERVICE_PATTERNS.find(({ pattern }) => pattern.test(decodedUrl))
    if (!matchedPattern) {
        return decodedUrl.replace(/#$/, '')
    }

    const matchedUrl = decodedUrl.match(matchedPattern.pattern)?.[0]
    return (matchedUrl || decodedUrl).replace(/#$/, '')
}

const extractPassword = (rawUrl: string): string | undefined => {
    const decodedUrl = decodeJsonFragment(rawUrl)
        .replace(/&amp;/g, '&')
        .trim()

    const queryPassword = decodedUrl.match(/[?&](?:pwd|password)=([A-Za-z0-9]+)/i)?.[1]
    if (queryPassword) {
        return queryPassword
    }

    return decodedUrl.match(/提取码[:：]?([A-Za-z0-9]+)/)?.[1]
}

const extractDocuments = (html: string): XiaokupanDocument[] => {
    const documents: XiaokupanDocument[] = []
    let match: RegExpExecArray | null

    while ((match = DIGITAL_DOCUMENT_REGEX.exec(html)) !== null) {
        const name = normalizeTitle(decodeJsonFragment(match[1] || ''))
        const description = normalizeWhitespace(decodeJsonFragment(match[2] || ''))
        const url = decodeJsonFragment(match[3] || '').trim()

        if (!name || !url) {
            continue
        }

        documents.push({
            name,
            description,
            url
        })
    }

    return documents
}

const transformDocuments = (documents: XiaokupanDocument[]): TransformedResult => {
    const grouped = new Map<string, Link[]>()

    documents.forEach(document => {
        const link = normalizeLink(document.url)
        if (!link) {
            return
        }

        const service = detectService(link, document.description)
        const pwd = extractPassword(document.url)
        const links = grouped.get(document.name) || []

        const duplicate = links.some(existing => existing.link === link && existing.pwd === pwd)
        if (!duplicate) {
            links.push({
                service,
                link,
                pwd
            })
        }

        grouped.set(document.name, links)
    })

    const list = Array.from(grouped.entries())
        .map(([name, links]) => ({ name, links }))
        .filter(item => item.links.length > 0)
        .slice(0, 100)

    return {
        list,
        code: list.length > 0 ? 200 : 206,
        msg: list.length > 0 ? 'success' : '未找到相关资源'
    }
}

export default defineEventHandler(async (event: H3Event): Promise<TransformedResult> => {
    try {
        const body = await readBody<SearchBody>(event)
        const searchTerm = body?.name?.trim()

        if (!searchTerm) {
            return {
                list: [],
                code: 400,
                msg: 'Search term is required'
            }
        }

        const searchUrl = `${SEARCH_BASE_URL}/${encodeURIComponent(searchTerm)}`
        const html = await $fetch<string>(searchUrl, {
            method: 'GET',
            responseType: 'text',
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                'Referer': 'https://xiaokupan.com/'
            }
        })

        const documents = extractDocuments(html)
        return transformDocuments(documents)
    } catch (error: any) {
        console.error('[Xiaokupan] 搜索失败:', error)
        return {
            list: [],
            code: 500,
            msg: error?.message || 'Error fetching data'
        }
    }
})
