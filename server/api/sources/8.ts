import type { H3Event } from 'h3'

/**
 * Pansou API 搜索源
 * 
 * 基于 https://github.com/leixuuu/pansou 提供的搜索 API
 * 支持搜索多个网盘平台的资源链接
 * 
 * 支持的网盘类型：
 * - 百度网盘 (baidu)
 * - 阿里云盘 (aliyun)
 * - 夸克网盘 (quark)
 * - 天翼云盘 (tianyi)
 * - UC网盘 (uc)
 * - 移动云盘 (mobile)
 * - 115网盘 (115)
 * - PikPak (pikpak)
 * - 迅雷网盘 (xunlei)
 * - 123网盘 (123)
 * - 磁力链接 (magnet)
 * - 电驴链接 (ed2k)
 * - 其他 (others)
 */

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
    'aliyun': 'ALIYUN',
    'magnet': 'MAGNET',
    'ed2k': 'ED2K',
    'others': 'OTHER'
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
            msg: '未找到数据'
        }
    }

    // 按资源标题分组
    const groupedByTitle = new Map<string, Link[]>()

    // 遍历所有网盘类型
    Object.entries(responseData.data.merged_by_type).forEach(([type, items]) => {
        if (!items || !Array.isArray(items)) return

        const service = SERVICE_MAPPING[type] || 'OTHER'

        items.forEach(item => {
            // 基本验证
            if (!item.url || !item.note) return

            // 清理标题
            let title = item.note.trim()
            
            // 移除常见的格式化字符和emoji
            title = title.replace(/^【|】$|🗄｜🔥|✅|🀄|🔴|🟢|💖|❤️|💚|💛|🍄|🔶|◀|▉|▶|━|─|＞|｜|📽️|🎞️|🏠|%%|⚡|🌟|⭐|🎬|🎥|🎯|🎪|🎭|🎨|🎤|🎵|🎶/g, '')
            
            // 移除多余空格
            title = title.replace(/\s+/g, ' ').trim()
            
            // 过滤掉太短或无意义的标题
            if (title.length < 2) return

            // 如果标题包含搜索关键词，则添加到结果中
            if (title.toLowerCase().includes(searchTermLower)) {
                if (!groupedByTitle.has(title)) {
                    groupedByTitle.set(title, [])
                }

                const link = formatPansouItem(item, service)
                const existingLinks = groupedByTitle.get(title)!
                
                // 避免添加重复的链接
                const isDuplicate = existingLinks.some(l => l.link === link.link)
                if (!isDuplicate) {
                    existingLinks.push(link)
                }
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

    // 多维度排序
    results.sort((a, b) => {
        // 1. 优先按链接数量排序（资源多的排前面）
        const linkCountDiff = b.links.length - a.links.length
        if (linkCountDiff !== 0) return linkCountDiff
        
        // 2. 其次按标题长度排序（标题更完整的排前面）
        return a.name.length - b.name.length
    })

    console.log(`[Pansou API] 处理完成，返回 ${results.length} 条结果`)

    return {
        list: results.slice(0, 100), // 限制返回100个结果
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
            refresh: 'false',    // 不强制刷新缓存，提高响应速度
            res: 'merge',        // 返回合并后的结果
            src: 'all',          // 搜索所有来源（TG + 插件）
        })

        // 可选：指定要搜索的网盘类型（不指定则返回所有类型）
        // params.append('cloud_types', 'baidu,aliyun,quark,tianyi,uc,mobile,115,pikpak,xunlei,123')

        try {
            const responseData = await $fetch<PansouApiResponse>(`${apiUrl}?${params.toString()}`, {
                method: 'GET',
                timeout: 15000, // 15秒超时（API可能需要更多时间）
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json'
                }
            })

            // API 成功响应码为 0
            if (responseData.code !== 0) {
                console.error(`[Pansou API] 错误响应: code=${responseData.code}, message=${responseData.message}`)
                return {
                    list: [],
                    code: 500,
                    msg: responseData.message || 'API返回错误状态'
                }
            }

            // 检查是否有数据
            if (!responseData.data || !responseData.data.merged_by_type) {
                console.warn(`[Pansou API] 无搜索结果: ${searchTerm}`)
                return {
                    list: [],
                    code: 200,
                    msg: '未找到相关资源'
                }
            }

            console.log(`[Pansou API] 搜索成功: ${searchTerm}, 总数=${responseData.data.total || 0}`)
            return processApiResponse(responseData, searchTerm)

        } catch (error: any) {
            console.error(`[Pansou API] 请求失败:`, {
                error: error.message || error,
                searchTerm,
                timestamp: new Date().toISOString()
            })
            return {
                list: [],
                code: 500,
                msg: error.message || 'API请求失败'
            }
        }

    } catch (error: any) {
        console.error('[Pansou API] 处理异常:', error)
        return {
            list: [],
            code: 500,
            msg: error.message || '服务器内部错误'
        }
    }
})
