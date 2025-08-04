import type { H3Event } from 'h3'

// 定义API响应类型
interface PansouApiResponse {
    code: number
    message: string
    data: {
        total: number
        merged_by_type: {
            baidu?: PansouItem[]
            115?: PansouItem[]
            tianyi?: PansouItem[]
            quark?: PansouItem[]
            uc?: PansouItem[]
            mobile?: PansouItem[]
            xunlei?: PansouItem[]
            aliyun?: PansouItem[]
            pikpak?: PansouItem[]
            123?: PansouItem[]
            [key: string]: PansouItem[] | undefined
        }
    }
}

interface PansouItem {
    url: string
    password: string
    note: string
    datetime: string
}

// 定义项目数据类型
interface Link {
    service: 'BAIDU' | 'XUNLEI' | 'QUARK' | 'ALIYUN' | 'UC' | 'TIANYI' | 'MOBILE' | '115' | 'PIKPAK' | '123' | 'OTHER'
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

interface SearchBody {
    name: string
}

// 网盘类型映射
const SERVICE_MAPPING: Record<string, Link['service']> = {
    'baidu': 'BAIDU',
    'xunlei': 'XUNLEI',
    'quark': 'QUARK',
    'uc': 'UC',
    'tianyi': 'TIANYI',
    'mobile': 'MOBILE',
    '115': '115',
    'pikpak': 'PIKPAK',
    '123': '123',
    'aliyun': 'ALIYUN'
}

// 格式化单个资源项
function formatPansouItem(item: PansouItem, service: Link['service']): Link {
    return {
        service,
        link: item.url,
        pwd: item.password || undefined
    }
}

// 处理API响应数据
function processApiResponse(responseData: PansouApiResponse, searchTerm: string): TransformedResult {
    const results: TransformedItem[] = []
    const searchTermLower = searchTerm.toLowerCase()

    if (!responseData.data?.merged_by_type) {
        return {
            list: [],
            code: 200,
            msg: 'No data found'
        }
    }

    // 按资源标题分组
    const groupedByTitle = new Map<string, Link[]>()

    // 遍历所有网盘类型
    Object.entries(responseData.data.merged_by_type).forEach(([type, items]) => {
        if (!items || !Array.isArray(items)) return

        const service = SERVICE_MAPPING[type] || 'OTHER'

        items.forEach(item => {
            if (!item.url || !item.note) return

            // 清理标题
            let title = item.note.trim()
            // 移除常见的格式化字符
            title = title.replace(/^【|】$|🔥|✅|🀄|🔴|🟢|💖|❤️|💚|💛|🍄|🔶|◀|▉|▶|━|─|＞|｜|📽️|🎞️|🏠|%%/g, '')
            title = title.replace(/\s+/g, ' ').trim()

            // 如果标题包含搜索关键词，则添加到结果中
            if (title.toLowerCase().includes(searchTermLower)) {
                if (!groupedByTitle.has(title)) {
                    groupedByTitle.set(title, [])
                }

                const link = formatPansouItem(item, service)
                groupedByTitle.get(title)!.push(link)
            }
        })
    })

    // 转换为最终格式
    groupedByTitle.forEach((links, title) => {
        if (links.length > 0) {
            results.push({
                name: title,
                links: links
            })
        }
    })

    // 按链接数量排序（资源多的排前面）
    results.sort((a, b) => b.links.length - a.links.length)

    return {
        list: results.slice(0, 50), // 限制返回50个结果
        code: 200,
        msg: 'success'
    }
}

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

        const searchTerm = body.name.trim()

        // 调用pansou API
        const apiUrl = 'https://pansou.aipan.me/api/search'
        const params = new URLSearchParams({
            kw: searchTerm,
            refresh: 'false',
            res: 'merge',
            src: 'all',
            cloud_types: 'baidu,aliyun,quark,tianyi,uc,mobile,115,pikpak,xunlei,123',
        })

        console.log(`调用pansou API: ${apiUrl}?${params.toString()}`)

        try {
            const responseData = await $fetch<PansouApiResponse>(`${apiUrl}?${params.toString()}`, {
                method: 'GET',
                timeout: 10000, // 10秒超时
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            })

            if (responseData.code !== 0) {
                console.error('API返回错误:', responseData.message)
                return {
                    list: [],
                    code: 500,
                    msg: responseData.message || 'API error'
                }
            }

            console.log(`API响应成功，总数: ${responseData.data?.total || 0}`)
            return processApiResponse(responseData, searchTerm)

        } catch (error) {
            console.error('API调用失败:', error)
            return {
                list: [],
                code: 500,
                msg: 'API request failed'
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
