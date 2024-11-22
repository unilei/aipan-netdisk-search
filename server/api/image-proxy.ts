import { defineEventHandler, getQuery } from 'h3'
import { createError } from 'h3'
import axios from 'axios'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const imageUrl = query.url as string

    if (!imageUrl) {
      throw createError({
        statusCode: 400,
        message: 'Missing image URL'
      })
    }

    // 设置请求头，模拟浏览器请求
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://movie.douban.com'
      },
      timeout: 5000
    })

    // 设置响应头
    event.node.res.setHeader('Content-Type', response.headers['content-type'])
    event.node.res.setHeader('Cache-Control', 'public, max-age=31536000') // 缓存一年

    return response.data
  } catch (error) {
    // 如果获取图片失败，返回一个默认的占位图
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch image'
    })
  }
})
