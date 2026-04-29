const FLAC_BASE = 'https://flacdownloader.com/flac'
const DOWNLOAD_ACCESS_KEY = 'l@p*gute)77=g5clebcp4lz#=x%(*rwg+ku0_)bh=&%6wg!a'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const trackId = (query.t as string) || ''
    const format = (query.f as string) || 'FLAC'

    if (!trackId) {
      return { code: 400, msg: 'Missing track ID' }
    }

    // Step 1: Get download token
    const tokenRes: any = await $fetch(`${FLAC_BASE}/download-token`, {
      method: 'GET',
      query: { t: trackId, f: format },
      headers: {
        'Referer': 'https://flacdownloader.com/',
        'X-Download-Access': DOWNLOAD_ACCESS_KEY,
      },
    })

    if (!tokenRes.token) {
      return { code: 403, msg: 'Failed to get download token', detail: tokenRes.detail }
    }

    const { token, expires } = tokenRes

    // Step 2: Fetch the FLAC file and stream to client
    const encodedToken = encodeURIComponent(token)
    const downloadUrl = `${FLAC_BASE}/download?t=${trackId}&f=${format}&token=${encodedToken}&expires=${expires}`

    const response = await fetch(downloadUrl, {
      headers: { Referer: 'https://flacdownloader.com/' },
    })

    if (!response.ok) {
      return { code: response.status, msg: `Download failed: ${response.statusText}` }
    }

    // Forward headers from the upstream
    const contentDisposition = response.headers.get('content-disposition')
    const contentType = response.headers.get('content-type') || 'audio/flac'
    const contentLength = response.headers.get('content-length')

    setResponseHeaders(event, {
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Access-Control-Allow-Origin': '*',
    })

    if (contentDisposition) {
      setResponseHeader(event, 'Content-Disposition', contentDisposition)
    }

    if (contentLength) {
      setResponseHeader(event, 'Content-Length', contentLength)
    }

    return response.body
  } catch (e) {
    console.error('FLAC download error:', e)
    return { code: 500, msg: 'Server error during download' }
  }
})
