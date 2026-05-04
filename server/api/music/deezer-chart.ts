export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const limit = parseInt(query.limit as string) || 30

    const res: any = await $fetch('https://api.deezer.com/chart/0/tracks', {
      method: 'GET',
      query: {
        limit,
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
      rank: item.rank || item.position || 0,
    }))

    return {
      code: 200,
      msg: 'success',
      data,
      total: res.total || data.length,
    }
  } catch (e) {
    console.error('Deezer chart error:', e)
    return {
      code: 500,
      msg: 'error',
      data: [],
      total: 0,
    }
  }
})
