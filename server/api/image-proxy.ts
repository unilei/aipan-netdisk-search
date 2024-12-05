import { createHash } from 'crypto'
import { promises as fs } from 'fs'
import { join } from 'path'
import { defineEventHandler, getQuery, createError } from 'h3'
import axios from 'axios'
import sharp from 'sharp'

const CACHE_DIR = join(process.cwd(), 'public', 'image-cache')
const CACHE_MAX_AGE = 31536000 // 1 year in seconds

// 确保缓存目录存在
async function ensureCacheDir() {
  try {
    await fs.access(CACHE_DIR)
  } catch {
    await fs.mkdir(CACHE_DIR, { recursive: true })
  }
}

// 生成缓存文件名
function getCacheFileName(url: string): string {
  const hash = createHash('md5').update(url).digest('hex')
  return `${hash}.webp`
}

export default defineEventHandler(async event => {
  try {
    const query = getQuery(event)
    const imageUrl = query.url as string

    if (!imageUrl) {
      throw createError({
        statusCode: 400,
        message: 'Missing image URL',
      })
    }

    await ensureCacheDir()
    const cacheFile = join(CACHE_DIR, getCacheFileName(imageUrl))

    // 检查缓存
    try {
      const stats = await fs.stat(cacheFile)
      const buffer = await fs.readFile(cacheFile)

      event.node.res.setHeader('Content-Type', 'image/webp')
      event.node.res.setHeader('Cache-Control', `public, max-age=${CACHE_MAX_AGE}`)
      event.node.res.setHeader('X-Cache', 'HIT')

      return buffer
    } catch (error) {
      // 缓存未命中，继续处理
    }

    // 获取原始图片
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        Referer: 'https://movie.douban.com',
      },
      timeout: 5000,
    })

    // 使用 sharp 处理图片
    const optimizedImage = await sharp(response.data)
      .webp({ quality: 80 })
      .resize(300, 400, {
        fit: 'cover',
        position: 'center',
      })
      .toBuffer()

    // 保存到缓存
    await fs.writeFile(cacheFile, optimizedImage)

    // 设置响应头
    event.node.res.setHeader('Content-Type', 'image/webp')
    event.node.res.setHeader('Cache-Control', `public, max-age=${CACHE_MAX_AGE}`)
    event.node.res.setHeader('X-Cache', 'MISS')

    return optimizedImage
  } catch (error) {
    console.error('Image proxy error:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch or process image',
    })
  }
})
