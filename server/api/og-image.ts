import { defineEventHandler, createError } from 'h3'
import sharp from 'sharp'
import { join } from 'path'

export default defineEventHandler(async (event) => {
    try {
        // Create a new image with a gradient background
        const width = 1200
        const height = 630

        // Create a gradient SVG
        const svg = `
      <svg width="${width}" height="${height}">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#grad)" />
        <text x="50%" y="45%" text-anchor="middle" font-family="Arial" font-size="80" font-weight="bold" fill="white">AIPAN.ME</text>
        <text x="50%" y="60%" text-anchor="middle" font-family="Arial" font-size="32" fill="white">网盘资源搜索引擎</text>
      </svg>
    `

        // Generate image from SVG
        const buffer = await sharp(Buffer.from(svg))
            .toFormat('jpeg', { quality: 90 })
            .toBuffer()

        // Set response headers
        event.node.res.setHeader('Content-Type', 'image/jpeg')
        event.node.res.setHeader('Cache-Control', 'public, max-age=31536000')

        return buffer
    } catch (error) {
        console.error('Failed to generate OG image:', error)
        throw createError({
            statusCode: 500,
            message: 'Failed to generate OG image'
        })
    }
}) 