// 定义API响应类型
interface DramaApiResponse {
  code: number
  msg: string
  page: number
  pagecount: number
  limit: number
  total: number
  list: Array<{
    vod_id: number
    vod_name: string
    vod_class?: string
    [key: string]: any
  }>
  class?: Array<{
    type_id: number
    type_pid: number
    type_name: string
  }>
}

export default defineEventHandler(async (event) => {
  try {

    const body = await readBody(event)

    // 调用影视API获取数据
    const apiUrl = body.source.api
    const response = await $fetch<DramaApiResponse>(apiUrl, {
      query: {
        ac: 'list',
        pg: 1,
      }
    })
    // 确保响应是对象格式
    let parsedResponse = response
    if (typeof response === 'string') {
      try {
        parsedResponse = JSON.parse(response)
      } catch (error) {
        throw new Error('API响应不是有效的JSON格式')
      }
    }

    if (parsedResponse?.code !== 1) {
      throw new Error(`API返回错误状态: ${parsedResponse?.code}`)
    }

    // 使用系统分类结构
    const systemCategories = parsedResponse.class || []


    // 定义分类图标映射
    const getTagIcon = (tagName: string): string => {
      const iconMap: Record<string, string> = {
        // 主要分类
        '电影': 'fas fa-film',
        '电视剧': 'fas fa-tv',
        '动漫': 'fas fa-dragon',
        '综艺': 'fas fa-microphone',
        '短剧': 'fas fa-play-circle',
        '壳儿': 'fas fa-star',

        // 电影分类
        '剧情片': 'fas fa-theater-masks',
        '动作片': 'fas fa-fist-raised',
        '冒险片': 'fas fa-compass',
        '同性片': 'fas fa-rainbow',
        '喜剧片': 'fas fa-laugh',
        '奇幻片': 'fas fa-hat-wizard',
        '恐怖片': 'fas fa-ghost',
        '悬疑片': 'fas fa-search',
        '惊悚片': 'fas fa-exclamation-triangle',
        '灾难片': 'fas fa-fire',
        '爱情片': 'fas fa-heart',
        '犯罪片': 'fas fa-user-secret',
        '科幻片': 'fas fa-rocket',
        '动画电影': 'fas fa-palette',
        '歌舞片': 'fas fa-music',
        '战争片': 'fas fa-shield-alt',
        '经典片': 'fas fa-star',
        '网络电影': 'fas fa-wifi',
        '其它片': 'fas fa-ellipsis-h',
        '教程': 'fas fa-book'
      }
      return iconMap[tagName] || 'fas fa-tag'
    }

    // 构建树形分类结构
    const buildCategoryTree = (categories: any[]) => {
      const categoryMap = new Map()
      const rootCategories: any[] = []

      // 先创建所有分类的映射
      categories.forEach((cat: any) => {
        categoryMap.set(cat.type_id, {
          id: cat.type_id,
          name: cat.type_name,
          icon: getTagIcon(cat.type_name),
          count: 0,
          parentId: cat.type_pid,
          children: []
        })
      })

      // 构建父子关系
      categories.forEach((cat: any) => {
        const category = categoryMap.get(cat.type_id)
        if (cat.type_pid === 0 || cat.type_pid === 1) {
          // 根分类
          rootCategories.push(category)
        } else {
          // 子分类
          const parent = categoryMap.get(cat.type_pid)
          if (parent) {
            parent.children.push(category)
          }
        }
      })

      return rootCategories
    }

    const categoryTree = buildCategoryTree(systemCategories)

    // 构建分类数据
    const categories = [
      {
        id: null,
        name: '全部',
        icon: 'fas fa-th-large',
        count: parsedResponse.total || 0,
        children: []
      },
      ...categoryTree
    ]

    return {
      success: true,
      data: categories,
      total: categories.length - 1,
      message: '获取分类成功'
    }

  } catch (error) {
    console.error('获取分类失败:', error)
    return {
      success: false,
      data: [],
      total: 0,
      message: '获取分类失败'
    }
  }
})
