export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const url = query.url as string

    if (!url) {
        throw createError({
            statusCode: 400,
            message: 'URL parameter is required'
        })
    }

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                'Referer': 'https://movie.douban.com/',
                'Origin': 'https://movie.douban.com',
                'Sec-Fetch-Dest': 'image',
                'Sec-Fetch-Mode': 'no-cors',
                'Sec-Fetch-Site': 'cross-site',
            }
        })

        if (!response.ok) {
            console.error(`Failed to fetch image: ${url}, status: ${response.status}`)
            throw createError({
                statusCode: response.status,
                message: `Failed to fetch image: ${response.statusText}`
            })
        }

        // Get the original content type
        const contentType = response.headers.get('content-type')
        
        // Set appropriate headers
        setHeader(event, 'Content-Type', contentType || 'image/jpeg')
        setHeader(event, 'Cache-Control', 'public, max-age=31536000') // Cache for 1 year
        setHeader(event, 'Access-Control-Allow-Origin', '*')
        
        // Get the response as buffer
        const buffer = await response.arrayBuffer()
        return buffer

    } catch (error) {
        console.error('Proxy image error:', error)
        throw createError({
            statusCode: 500,
            message: 'Failed to proxy image'
        })
    }
})
