import { defineEventHandler, createError } from 'h3'
import { createCanvas } from 'canvas'

export default defineEventHandler(async (event) => {
  try {
    // 检查 canvas 是否可用
    if (!createCanvas) {
      throw new Error('Canvas is not available')
    }

    // Create canvas
    const width = 1200
    const height = 630
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')

    // Create radial gradient background for more depth
    const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) / 2)
    gradient.addColorStop(0, '#667eea')
    gradient.addColorStop(0.5, '#764ba2')
    gradient.addColorStop(1, '#1e3c72')

    // Fill background with gradient
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // Add decorative circles for visual interest
    ctx.globalAlpha = 0.1
    for (let i = 0; i < 8; i++) {
      const x = Math.random() * width
      const y = Math.random() * height
      const radius = Math.random() * 100 + 50
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fillStyle = 'white'
      ctx.fill()
    }
    ctx.globalAlpha = 1

    // Add text shadow effect
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
    ctx.shadowBlur = 10
    ctx.shadowOffsetX = 3
    ctx.shadowOffsetY = 3

    // 添加主标题
    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.font = 'bold 48px Arial'
    ctx.textAlign = 'center'

    // 添加文字阴影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
    ctx.shadowBlur = 4
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2

    // 绘制描边
    ctx.strokeText('AIPAN.ME', canvas.width / 2, 260)
    // 绘制填充
    ctx.fillText('AIPAN.ME', canvas.width / 2, 260)

    // 重置阴影
    ctx.shadowColor = 'transparent'

    // 添加副标题
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.font = '28px Arial'
    ctx.fillText('综合数字娱乐平台', canvas.width / 2, 320)

    // 添加功能描述
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.font = '20px Arial'
    ctx.fillText('网盘搜索 · AI助手 · 音乐播放 · 游戏娱乐', canvas.width / 2, 360)
    ctx.fillText('博客论坛 · 聊天社区 · TV直播', canvas.width / 2, 390)

    // Add a decorative line
    ctx.shadowColor = 'transparent'
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(width / 2 - 150, height * 0.68)
    ctx.lineTo(width / 2 + 150, height * 0.68)
    ctx.stroke()

    // Add small decorative dots
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    for (let i = 0; i < 3; i++) {
      ctx.beginPath()
      ctx.arc(width / 2 - 60 + i * 60, height * 0.75, 4, 0, Math.PI * 2)
      ctx.fill()
    }

    // Convert canvas to buffer
    const buffer = canvas.toBuffer('image/jpeg', { quality: 0.9 })

    // Set response headers
    event.node.res.setHeader('Content-Type', 'image/jpeg')
    event.node.res.setHeader('Cache-Control', 'public, max-age=31536000')

    return buffer
  } catch (error) {
    console.error('Failed to generate OG image:', error)

    // 返回一个简单的 SVG 作为后备方案
    const fallbackSvg = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)"/>
        <text x="600" y="280" font-family="Arial, sans-serif" font-size="48" font-weight="bold" text-anchor="middle" fill="white">AIPAN.ME</text>
        <text x="600" y="340" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" fill="rgba(255,255,255,0.9)">AI网盘搜索 · 智能助手 · 多功能平台</text>
        <text x="600" y="380" font-family="Arial, sans-serif" font-size="20" text-anchor="middle" fill="rgba(255,255,255,0.8)">网盘搜索 · AI助手 · 音乐播放 · 游戏娱乐</text>
        <text x="600" y="410" font-family="Arial, sans-serif" font-size="20" text-anchor="middle" fill="rgba(255,255,255,0.8)">博客论坛 · 聊天社区 · TV直播</text>
      </svg>
    `

    event.node.res.setHeader('Content-Type', 'image/svg+xml')
    event.node.res.setHeader('Cache-Control', 'public, max-age=3600')

    return fallbackSvg
  }
})
