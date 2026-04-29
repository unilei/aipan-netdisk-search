export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const q = (query.q as string) || ''
    const limit = parseInt(query.limit as string) || 30
    const index = parseInt(query.index as string) || 0

    if (!q.trim()) {
      return {
        code: 400,
        msg: 'Missing search query',
        data: [],
        total: 0,
      }
    }

    const res: any = await $fetch('https://api.deezer.com/search', {
      method: 'GET',
      query: {
        q,
        limit,
        index,
      },
    })

    // Map Deezer response to our expected format
    const data = (res.data || []).map((item: any) => ({
      id: item.id,
      name: item.title,
      artist: item.artist?.name || '',
      artistPicture: item.artist?.picture_medium || '',
      album: item.album?.title || '',
      albumCover: item.album?.cover_medium || '',
      albumCoverBig: item.album?.cover_big || '',
      duration: item.duration || 0,
      preview: item.preview || '',
      rank: item.rank || 0,
    }))

    return {
      code: 200,
      msg: 'success',
      data,
      total: res.total || 0,
      next: res.next || null,
    }
  } catch (e) {
    console.error('Deezer search error:', e)
    return {
      code: 500,
      msg: 'error',
      data: [],
      total: 0,
    }
  }
})
