import { H3Event } from 'h3'
import { $fetch } from 'ofetch'
import { extractLinks } from '~/server/utils/aipan'
import type {
    SearchBody,
    TransformedResult,
    Link
} from '~/server/utils/aipan'
import * as cheerio from 'cheerio'

// 自定义获取API接口，适应HTML响应解析
const fetchViprayApi = async (url: string, body: SearchBody): Promise<any> => {
    try {
        // 构建查询参数
        const params = {
            wd: body.name
        }

        // 确保使用POST方法，URL已包含m=vod-search参数
        const response = await $fetch(url, {
            method: 'POST',
            // 使用params而不是body，这样会自动处理为x-www-form-urlencoded格式
            params: params,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Referer': 'http://transition.vipray.cn/'
            },
            // 确保返回原始文本而不是自动解析JSON
            responseType: 'text'
        })

        // 使用cheerio解析HTML
        const $ = cheerio.load(response as string)

        // 创建结果数组
        const resultItems: Array<{ question: string, answer: string }> = []

        // 遍历HTML中的结果项
        $('.show3').each((_, element) => {
            const title = $(element).find('p').text().trim()

            // 收集所有的网盘链接
            let linksHtml = ''
            $(element).find('.pan2 a').each((_, linkEl) => {
                const linkText = $(linkEl).text().trim()
                const linkHref = $(linkEl).attr('href') || ''
                if (linkHref) {
                    linksHtml += `${linkText}: ${linkHref}\n`
                }
            })

            // 将结果添加到数组
            if (title && linksHtml) {
                resultItems.push({
                    question: title,
                    answer: linksHtml
                })
            }
        })

        return {
            list: resultItems,
            code: resultItems.length > 0 ? 200 : 204
        }
    } catch (error) {
        console.error('Fetch error:', error)
        throw error
    }
}

export default defineEventHandler(async (event: H3Event): Promise<TransformedResult> => {
    try {
        const body = await readBody<SearchBody>(event)
        if (!body?.name?.trim()) {
            throw new Error('Search term is required')
        }

        // 使用截图中完整的URL
        const searchUrl = "http://transition.vipray.cn/index.php?m=vod-search"

        try {
            // 使用自定义方法发送POST请求并解析HTML
            const result = await fetchViprayApi(searchUrl, body)

            // 处理返回结果并转换格式
            const transformedList = result.list
                .filter((item: any) => item?.question)
                .map((item: any) => ({
                    name: item.question,
                    links: extractLinks(item.answer)
                }))

            return {
                list: transformedList,
                code: transformedList.length > 0 ? 200 : 206,
                msg: transformedList.length === 0 ? 'No results found' : undefined
            }
        } catch (error: any) {
            console.error('API error:', error)
            return {
                list: [],
                code: 500,
                msg: error.message || 'Error fetching data'
            }
        }
    } catch (error: any) {
        console.error('Handler error:', error)
        return {
            list: [],
            code: 500,
            msg: error.message || 'Internal server error'
        }
    }
})
