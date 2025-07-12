// 定义API响应类型
interface DramaDetailResponse {
  code: number
  msg: string
  list: Array<{
    vod_id: number
    vod_name: string
    vod_sub?: string
    vod_pic?: string
    vod_actor?: string
    vod_director?: string
    vod_area?: string
    vod_lang?: string
    vod_year?: string
    vod_remarks?: string
    vod_score?: string
    vod_total?: number
    vod_content?: string
    vod_blurb?: string
    vod_play_from?: string
    vod_play_url?: string
    vod_time?: string
    type_name?: string
    vod_class?: string
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
    let ids = body.ids
    let source = body.source

    if (!ids) {
      throw new Error('缺少影视ID参数')
    }

    // 调用影视详情API
    const response = await $fetch<DramaDetailResponse>(source.api, {
      method: 'GET',
      query: {
        ac: 'detail',
        ids: ids
      },
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

    if (!(parsedResponse as any).list || (parsedResponse as any).list.length === 0) {
      throw new Error('未找到影视详情')
    }

    const drama = (parsedResponse as any).list[0]

    // 解析播放链接
    const parsePlayUrls = (playUrl: string) => {
      if (!playUrl) return []

      const episodes = []
      const fragments = playUrl.includes('#') ? playUrl.split('#') : playUrl.split('$$$')

      for (const fragment of fragments) {
        const parts = fragment.split('$')
        if (parts.length === 2) {
          const episodeNumber = parts[0].trim()
          const episodeLink = parts[1].trim()
          if (episodeLink.length > 10) {
            episodes.push({
              number: episodeNumber,
              url: episodeLink
            })
          }
        }
      }

      return episodes
    }

    // 格式化详情数据
    const formattedDrama = {
      id: drama.vod_id,
      name: drama.vod_name,
      subName: drama.vod_sub || '',
      pic: drama.vod_pic || '',
      actor: drama.vod_actor || '',
      director: drama.vod_director || '',
      area: drama.vod_area || '',
      lang: drama.vod_lang || '',
      year: drama.vod_year || '',
      remarks: drama.vod_remarks || '',
      score: drama.vod_score || '0.0',
      total: drama.vod_total || 0,
      content: drama.vod_content || drama.vod_blurb || '',
      playFrom: drama.vod_play_from || '',
      episodes: parsePlayUrls(drama.vod_play_url || ''),
      updateTime: drama.vod_time || '',
      type: drama.type_name || '影视',
      tags: drama.vod_class ? drama.vod_class.split(',') : []
    }

    return {
      code: 200,
      msg: 'success',
      data: {
        ...formattedDrama
      }
    }

  } catch (error) {
    console.error('短剧详情API错误:', error)
    return {
      code: 500,
      msg: error instanceof Error ? error.message : '获取短剧详情失败',
      data: null
    }
  }
})
