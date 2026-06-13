import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';
import { createError, defineEventHandler, getQuery } from 'h3';
import axios from 'axios';
import sharp from 'sharp';

const CACHE_DIR = join(process.cwd(), 'public', 'image-cache');
const CACHE_MAX_AGE = 31536000;
const DEFAULT_IMAGE_WIDTH = 220;
const MIN_IMAGE_WIDTH = 80;
const MAX_IMAGE_WIDTH = 600;
const DEFAULT_IMAGE_QUALITY = 75;
const IMAGE_PROXY_FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400" role="img" aria-label="Image unavailable">
  <rect width="300" height="400" fill="#f1f5f9"/>
  <path d="M96 171h108a12 12 0 0 1 12 12v58a12 12 0 0 1-12 12H96a12 12 0 0 1-12-12v-58a12 12 0 0 1 12-12Zm9 62h90l-28-34-22 26-14-16-26 24Zm23-40a13 13 0 1 0 0-26 13 13 0 0 0 0 26Z" fill="#94a3b8"/>
  <text x="150" y="285" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#64748b">Image unavailable</text>
</svg>`;

async function ensureCacheDir() {
  try {
    await fs.access(CACHE_DIR);
  } catch {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  }
}

function getCacheFileName(url: string, width: number, quality: number) {
  const hash = createHash('md5').update(`${url}:${width}:${quality}`).digest('hex');
  return `${hash}.webp`;
}

function getImageWidth(value: unknown) {
  const parsed = Number(Array.isArray(value) ? value[0] : value);

  if (!Number.isFinite(parsed)) {
    return DEFAULT_IMAGE_WIDTH;
  }

  return Math.min(MAX_IMAGE_WIDTH, Math.max(MIN_IMAGE_WIDTH, Math.round(parsed)));
}

function getImageQuality(value: unknown) {
  const parsed = Number(Array.isArray(value) ? value[0] : value);

  if (!Number.isFinite(parsed)) {
    return DEFAULT_IMAGE_QUALITY;
  }

  return Math.min(90, Math.max(45, Math.round(parsed)));
}

function sendFallbackImage(event: any) {
  event.node.res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  event.node.res.setHeader('Cache-Control', 'public, max-age=300');
  event.node.res.setHeader('X-Image-Proxy-Fallback', '1');
  return IMAGE_PROXY_FALLBACK_SVG;
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const imageUrl = query.url as string;
  const imageWidth = getImageWidth(query.w ?? query.width);
  const imageQuality = getImageQuality(query.q ?? query.quality);
  const imageHeight = Math.round(imageWidth * 1.5);

  if (!imageUrl) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing url parameter',
    });
  }

  await ensureCacheDir();
  const cacheFile = join(CACHE_DIR, getCacheFileName(imageUrl, imageWidth, imageQuality));

  try {
    const cachedImage = await fs.readFile(cacheFile);

    event.node.res.setHeader('Content-Type', 'image/webp');
    event.node.res.setHeader('Cache-Control', `public, max-age=${CACHE_MAX_AGE}`);
    event.node.res.setHeader('X-Cache', 'HIT');

    return cachedImage;
  } catch {
    // Cache miss. Continue with the upstream fetch below.
  }

  try {
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
      .webp({ quality: imageQuality })
      .resize(imageWidth, imageHeight, {
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
    console.warn('Image proxy fallback:', error?.message || error);
    return sendFallbackImage(event);
  }
});
