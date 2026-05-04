import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';
import { createError, defineEventHandler, getQuery } from 'h3';
import axios from 'axios';
import sharp from 'sharp';

const CACHE_DIR = join(process.cwd(), 'public', 'image-cache');
const CACHE_MAX_AGE = 31536000;

async function ensureCacheDir() {
  try {
    await fs.access(CACHE_DIR);
  } catch {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  }
}

function getCacheFileName(url: string) {
  const hash = createHash('md5').update(url).digest('hex');
  return `${hash}.webp`;
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const imageUrl = query.url as string;

    if (!imageUrl) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing url parameter',
      });
    }

    await ensureCacheDir();
    const cacheFile = join(CACHE_DIR, getCacheFileName(imageUrl));

    try {
      const cachedImage = await fs.readFile(cacheFile);

      event.node.res.setHeader('Content-Type', 'image/webp');
      event.node.res.setHeader('Cache-Control', `public, max-age=${CACHE_MAX_AGE}`);
      event.node.res.setHeader('X-Cache', 'HIT');

      return cachedImage;
    } catch {
      // Cache miss. Continue with the upstream fetch below.
    }

    const response = await axios.get<ArrayBuffer>(imageUrl, {
      responseType: 'arraybuffer',
      headers: {
        Referer: 'https://movie.douban.com/',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 5000,
    });

    const optimizedImage = await sharp(Buffer.from(response.data))
      .webp({ quality: 80 })
      .resize(300, 400, {
        fit: 'cover',
        position: 'center',
      })
      .toBuffer();

    await fs.writeFile(cacheFile, optimizedImage);

    event.node.res.setHeader('Content-Type', 'image/webp');
    event.node.res.setHeader('Cache-Control', `public, max-age=${CACHE_MAX_AGE}`);
    event.node.res.setHeader('X-Cache', 'MISS');

    return optimizedImage;
  } catch (error: any) {
    console.error('Image proxy error:', error?.message || error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch image',
    });
  }
});
