import { createError } from 'h3'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const imageUrl = query.url

  if (!imageUrl) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing url parameter'
    })
  }

  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
      }
    })

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        statusMessage: response.statusText
      })
    }

    // 设置缓存头
    setHeader(event, 'Cache-Control', 'public, max-age=31536000')
    setHeader(event, 'Content-Type', response.headers.get('content-type') || 'image/jpeg')

    return response.body
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch image'
    })
  }
})
