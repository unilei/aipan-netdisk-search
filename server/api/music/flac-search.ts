export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const q = (query.q as string) || ''

    if (!q.trim()) {
      return {
        code: 400,
        msg: 'Missing search query',
        data: [],
        total: 0,
      }
    }

    const res: any = await $fetch('https://flacdownloader.com/flac/search', {
      method: 'GET',
      query: { query: q },
      headers: {
        Referer: 'https://flacdownloader.com/',
      },
    })

    // flacdownloader returns Deezer-format data
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
    console.error('FLAC search error:', e)
    return {
      code: 500,
      msg: 'error',
      data: [],
      total: 0,
    }
  }
})
