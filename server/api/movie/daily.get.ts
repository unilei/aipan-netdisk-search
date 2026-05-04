const TMDB_API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiNDJlOTIzYTc4OWY2YmEyNTI0MWJiYzA1NGNmZWVkYSIsIm5iZiI6MTcxMjc5Nzk1My4zMzYsInN1YiI6IjY2MTczOTAxZmQ2MzAwMDE2MzEwYmQyNSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.ZUJrvo6K0p_POaCs9nzN2Iz3MphQYOLYlR76DVqIuQg'
const TMDB_BASE = 'https://api.themoviedb.org/3'
const HEADERS = { accept: 'application/json', Authorization: `Bearer ${TMDB_API_KEY}` }

function toTodaySeed(): number {
  const d = new Date()
  // YYYYMMDD as seed
  return parseInt(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`)
}

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

async function getMovieDetails(movieId: number) {
  const [detailsRes, creditsRes, reviewsRes] = await Promise.all([
    $fetch(`${TMDB_BASE}/movie/${movieId}`, { headers: { ...HEADERS }, params: { language: 'zh-CN' } }),
    $fetch(`${TMDB_BASE}/movie/${movieId}/credits`, { headers: { ...HEADERS } }),
    $fetch(`${TMDB_BASE}/movie/${movieId}/reviews`, { headers: { ...HEADERS } }),
  ])

  const details: any = detailsRes
  const credits: any = creditsRes
  const reviews: any = reviewsRes

  const director = credits.crew?.find((p: any) => p.job === 'Director')?.name || '未知'
  const cast = (credits.cast || []).slice(0, 3).map((p: any) => p.name)
  const genres = (details.genres || []).map((g: any) => g.name)

  const movieInfo = [
    `- 电影名称：${details.title} (${details.original_title})`,
    `- 导演：${director}`,
    `- 主演：${cast.join(', ')}`,
    `- 类型：${genres.join(', ')}`,
    `- 片长：${details.runtime || '未知'}分钟`,
    `- 上映日期：${details.release_date || '未知'}`,
    `- 评分：${details.vote_average || '未知'}/10`,
    `- 剧情简介：${details.overview || '暂无简介'}`,
  ].join('\n')

  const formattedReviews = (reviews.results || []).slice(0, 3).map((r: any) => {
    const content = r.content?.length > 200 ? r.content.slice(0, 197) + '...' : r.content
    return `- 评论者：${r.author || '匿名用户'}\n- 评分：${r.author_details?.rating || '未评分'}/10\n- 评论内容：${content}`
  }).join('\n') || '暂无评论'

  const posterUrl = details.poster_path
    ? `https://image.tmdb.org/t/p/w500${details.poster_path}`
    : undefined

  return { movie_info: movieInfo, reviews: formattedReviews, poster_url: posterUrl }
}

export default defineEventHandler(async () => {
  try {
    // 抓取前三页热门电影
    const allMovies: any[] = []
    for (let page = 1; page <= 3; page++) {
      const res: any = await $fetch(`${TMDB_BASE}/movie/popular`, {
        headers: { ...HEADERS },
        params: { language: 'zh-CN', page },
      })
      if (res.results) allMovies.push(...res.results)
    }

    if (!allMovies.length) {
      return { code: 500, msg: '无法获取电影列表', data: null }
    }

    // 过滤评分 >= 7.0
    let filtered = allMovies.filter((m: any) => (m.vote_average || 0) >= 7.0)
    if (!filtered.length) filtered = allMovies

    // 用今天日期做种子随机选
    const rand = seededRandom(toTodaySeed())
    const selected = filtered[Math.floor(rand() * filtered.length)]

    const movieData = await getMovieDetails(selected.id)

    return { msg: 'success', data: movieData }
  } catch (e) {
    console.error('Movie daily fetch error:', e)
    return { code: 500, msg: '获取每日电影失败', data: null }
  }
})
