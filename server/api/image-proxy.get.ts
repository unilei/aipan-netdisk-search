export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const url = query.url as string;

  if (!url) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing url parameter'
    });
  }

  try {
    // 解码 URL
    const decodedUrl = decodeURIComponent(url);
    
    // 获取图片
    const response = await $fetch.raw(decodedUrl, {
      headers: {
        'Referer': 'https://movie.douban.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      responseType: 'arrayBuffer'
    });

    // 获取内容类型
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // 设置响应头
    setHeader(event, 'Content-Type', contentType);
    setHeader(event, 'Cache-Control', 'public, max-age=86400'); // 缓存1天
    setHeader(event, 'Access-Control-Allow-Origin', '*');
    
    return response._data;
  } catch (error: any) {
    console.error('Image proxy error:', error?.message || error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch image'
    });
  }
});
