// 定义API响应类型
interface DramaListResponse {
  code: number
  msg: string
  page: number
  pagecount: number
  limit: number
  total: number
  list: Array<{
    vod_id: number
    vod_name: string
    vod_pic?: string
    vod_remarks?: string
    type_name?: string
    vod_time?: string
    vod_play_from?: string
  }>
}

// VOD源类型定义
interface VodSource {
  key: string;
  name: string;
  api: string;
  playUrl: string;
  type: 'json' | 'xml';
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    // 构建API请求参数
    const apiParams: any = {
      ac: 'detail',
      pg: body.page,
      t: body.type_id
    }

    // 如果有关键词，添加搜索参数
    if (body.keyword) {
      apiParams.wd = body.keyword
    }

    // 调用影视API
    const response = await $fetch<DramaListResponse>(body.source.api, {
      method: 'GET',
      query: apiParams,
      timeout: 15000
    })


    // 检查API响应
    if (!response) {
      throw new Error('API无响应')
    }

    // 解析响应
    let parsedResponse = response
    if (typeof response === 'string') {
      try {
        parsedResponse = JSON.parse(response)
      } catch (e) {
        throw new Error('API响应JSON解析失败')
      }
    }

    if ((parsedResponse as any).code !== 1) {
      throw new Error(`API返回错误: ${(parsedResponse as any).msg || '未知错误'}`)
    }

    // 格式化数据
    let formattedList = (parsedResponse as any).list?.map((item: any) => ({
      id: item.vod_id,
      name: item.vod_name,
      subName: item.vod_sub || '',
      pic: item.vod_pic || '',
      remarks: item.vod_remarks || '',
      type: item.type_name || '影视',
      time: item.vod_time || '',
      playFrom: item.vod_play_from || '',
      actor: item.vod_actor || '',
      director: item.vod_director || '',
      area: item.vod_area || '',
      year: item.vod_year || '',
      score: item.vod_score || '0.0',
      total: item.vod_total || 0,
      blurb: item.vod_blurb || '',
      tags: item.vod_class ? item.vod_class.split(',').map((tag: string) => tag.trim()) : [],
      vod_class: item.vod_class || ''
    })) || []



    return {
      code: 200,
      msg: 'success',
      data: {
        list: formattedList,
        page: parseInt(body.page as string),
        pagecount: (parsedResponse as any).pagecount || 1,
        limit: parseInt(body.limit as string),
        total: (parsedResponse as any).total || 0
      }
    }

  } catch (error) {
    console.error('短剧列表API错误:', error)
    return {
      code: 500,
      msg: '获取短剧列表失败',
      data: {
        list: [],
        page: 1,
        pagecount: 1,
        limit: 20,
        total: 0
      }
    }
  }
})
