import lyricsService from './lyrics'
import { s2t, t2s } from 'chinese-s2t'

class PosterService {
  constructor() {
    this.templates = [
      {
        id: 'qinghuaci',
        name: '青花瓷',
        generate: this.generateCollagePoster.bind(this)
      },
    ]
  }

  // 繁体转简体函数
  toSimplified(text) {
    if (!text) return text
    return t2s(text)
  }

  async loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = url
    })
  }

  async generateCollagePoster(track, canvas, options = {}) {
    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height

    // 获取歌词，支持完整模式，并转换为简体
    const lyrics = await lyricsService.getLyrics(track)
    const previewLyrics = lyricsService.getPreviewLyrics(lyrics, 150, options.fullLyrics)
    const backgroundLyrics = lyricsService.getRandomLyricsSnippet(lyrics, 8, options.fullLyrics)

    // 转换歌曲名为简体
    track.name = this.toSimplified(track.name)
    track.artist = this.toSimplified(track.artist)

    // 设置青花瓷风格背景
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, '#f7f5f0')
    gradient.addColorStop(0.5, '#f0ede5')
    gradient.addColorStop(1, '#e8e4dc')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // 添加青花瓷纹理效果
    ctx.globalAlpha = 0.03
    for (let i = 0; i < height; i += 2) {
      const noise = Math.random() * 0.06
      ctx.fillStyle = `rgba(32, 64, 128, ${noise})`
      ctx.fillRect(0, i, width, 1)
    }
    
    // 添加青花瓷装饰纹样
    ctx.globalAlpha = 0.06
    for (let i = 0; i < width; i += 80) {
      for (let j = 0; j < height; j += 80) {
        if (Math.random() > 0.7) {
          this.drawPorcelainPattern(ctx, i, j, 40)
        }
      }
    }
    ctx.globalAlpha = 1.0

    // 添加歌词背景
    if (backgroundLyrics) {
      ctx.save()
      ctx.globalAlpha = 0.04
      ctx.fillStyle = '#1a4b8c'
      ctx.font = '28px "Ma Shan Zheng"'
      ctx.textAlign = 'left'
      
      const bgLyricsLines = backgroundLyrics.split('\n')
      let y = height * 0.1
      bgLyricsLines.forEach(line => {
        const x = Math.random() * width * 0.2
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(Math.random() * 0.06 - 0.03)
        ctx.fillText(line, 0, 0)
        ctx.restore()
        y += 45
      })
      ctx.restore()
    }

    // 绘制专辑封面
    const albumArt = await this.loadImage(track.albumArt)
    const artSize = options.fullLyrics ? 0 : Math.min(width * 0.42, height * 0.42)
    
    // 主图片
    if (!options.fullLyrics) {
      ctx.save()
      ctx.translate(width * 0.5, height * 0.35)
      ctx.rotate(Math.random() * 0.06 - 0.03)
      
      // 添加青花瓷风格边框
      ctx.shadowColor = 'rgba(0, 0, 0, 0.12)'
      ctx.shadowBlur = 20
      ctx.shadowOffsetX = 10
      ctx.shadowOffsetY = 10
      
      // 外层装饰边框
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(-artSize/2 - 20, -artSize/2 - 20, artSize + 40, artSize + 40)
      
      // 内层青花边框
      ctx.strokeStyle = '#1a4b8c'
      ctx.lineWidth = 2
      ctx.strokeRect(-artSize/2 - 12, -artSize/2 - 12, artSize + 24, artSize + 24)
      
      // 图片
      ctx.drawImage(albumArt, -artSize/2, -artSize/2, artSize, artSize)
      ctx.restore()
    }

    // 添加标题
    const title = track.name.split('')
    const titleX = width * 0.88
    let titleY = height * 0.15
    const titleSize = width * 0.035

    // 添加标题装饰线
    ctx.save()
    ctx.strokeStyle = '#1a4b8c'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(titleX - titleSize * 2.5, titleY - 40)
    ctx.lineTo(titleX - titleSize * 2.5, titleY + title.length * titleSize * 1.5 + 40)
    ctx.stroke()
    
    // 添加装饰点
    for (let i = 0; i < 3; i++) {
      const dotY = titleY - 40 + i * (title.length * titleSize * 1.5 + 80) / 2
      ctx.beginPath()
      ctx.arc(titleX - titleSize * 2.5, dotY, 3, 0, Math.PI * 2)
      ctx.fillStyle = '#1a4b8c'
      ctx.fill()
    }
    ctx.restore()

    title.forEach((char, index) => {
      ctx.save()
      ctx.translate(titleX, titleY)
      
      // 竖排文字背景
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
      ctx.shadowColor = 'rgba(0, 0, 0, 0.08)'
      ctx.shadowBlur = 8
      ctx.fillRect(-titleSize/1.2, -titleSize/2, titleSize*1.4, titleSize*1.4)
      
      // 文字
      ctx.font = `bold ${titleSize}px "Noto Serif SC"`
      ctx.fillStyle = '#1a4b8c'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(char, 0, 0)
      
      ctx.restore()
      titleY += titleSize * 1.5
    })

    // 添加歌词片段
    if (previewLyrics) {
      ctx.save()
      const lyricsX = options.fullLyrics ? width * 0.15 : width * 0.12
      let lyricsY = options.fullLyrics ? height * 0.15 : height * 0.62
      
      // 添加歌词标题
      const titleFontSize = options.fullLyrics ? Math.min(width * 0.04, 36) : 28
      ctx.font = `bold ${titleFontSize}px "Ma Shan Zheng"`
      ctx.fillStyle = '#1a4b8c'
      ctx.textAlign = 'left'
      if (!options.fullLyrics) {
        ctx.fillText('歌词:', lyricsX, lyricsY)
        lyricsY += 45
      }

      // 添加歌词内容
      const lyricsLines = previewLyrics.split('\n')
      
      if (options.fullLyrics) {
        // 动态计算字体大小
        const availableHeight = height * 0.8 // 增加可用高度为总高度的80%
        const lineSpacingRatio = 1.8 // 行间距是字体大小的1.8倍
        const maxFontSize = 32 // 最大字体大小
        const minFontSize = 16 // 最小字体大小
        
        // 根据行数和可用高度计算合适的字体大小
        let fontSize = Math.min(
          maxFontSize,
          Math.max(
            minFontSize,
            Math.floor(availableHeight / (lyricsLines.length * lineSpacingRatio))
          )
        )
        
        const lineHeight = fontSize * lineSpacingRatio
        ctx.font = `${fontSize}px "Ma Shan Zheng"`
        
        // 创建渐变效果
        const gradient = ctx.createLinearGradient(0, lyricsY, 0, height * 0.95)
        gradient.addColorStop(0, '#2a4a6c')
        gradient.addColorStop(0.95, '#2a4a6c')
        gradient.addColorStop(1, 'rgba(42, 74, 108, 0)')
        ctx.fillStyle = gradient

        // 居中显示歌词
        const totalLyricsHeight = lineHeight * lyricsLines.length
        const startY = (height - totalLyricsHeight) / 2

        // 在左上角添加歌词标题
        ctx.save()
        ctx.font = `bold ${titleFontSize}px "Ma Shan Zheng"`
        ctx.fillStyle = '#1a4b8c'
        ctx.textAlign = 'left'
        ctx.fillText('歌词', width * 0.05, height * 0.08)
        ctx.restore()

        lyricsLines.forEach((line, index) => {
          const y = startY + index * lineHeight
          
          ctx.save()
          ctx.translate(lyricsX, y)
          ctx.rotate(Math.random() * 0.008 - 0.004) // 更小的随机旋转角度
          const text = `『${line}』`
          
          // 计算每行文字宽度并调整位置
          const textWidth = ctx.measureText(text).width
          const maxWidth = width * 0.7 // 最大宽度为画布宽度的70%
          
          // 如果文字太长，缩小这一行的字体
          if (textWidth > maxWidth) {
            const scaleFactor = maxWidth / textWidth
            const adjustedFontSize = fontSize * scaleFactor
            ctx.font = `${adjustedFontSize}px "Ma Shan Zheng"`
          }
          
          ctx.fillText(text, 0, 0)
          ctx.restore()
        })
      } else {
        // 普通模式的歌词显示保持不变
        ctx.font = '22px "Ma Shan Zheng"'
        ctx.fillStyle = '#2a4a6c'
        
        lyricsLines.forEach(line => {
          ctx.save()
          ctx.translate(lyricsX + Math.random() * 3, lyricsY)
          ctx.rotate(Math.random() * 0.02 - 0.01)
          ctx.fillText(`『${line}』`, 0, 0)
          ctx.restore()
          lyricsY += 40
        })
      }
      ctx.restore()
    }

    // 添加青花瓷装饰
    this.drawPorcelainDecoration(ctx, width * 0.15, height * 0.82, 80)
    this.drawPorcelainDecoration(ctx, width * 0.85, height * 0.25, 60)

    // 添加艺术家名称
    ctx.save()
    ctx.font = 'bold 36px "Ma Shan Zheng"'
    ctx.fillStyle = '#1a4b8c'
    ctx.textAlign = 'center'
    
    // 艺术家名称背景
    const artistName = track.artist
    const artistWidth = ctx.measureText(artistName).width
    const artistPadding = 50
    
    // 绘制装饰性背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.08)'
    ctx.shadowBlur = 8
    
    // 绘制圆角矩形
    const rectX = width * 0.5 - artistWidth/2 - artistPadding/2
    const rectY = height * 0.9 - 25
    const rectWidth = artistWidth + artistPadding
    const rectHeight = 50
    const radius = 10
    
    ctx.beginPath()
    ctx.moveTo(rectX + radius, rectY)
    ctx.lineTo(rectX + rectWidth - radius, rectY)
    ctx.quadraticCurveTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + radius)
    ctx.lineTo(rectX + rectWidth, rectY + rectHeight - radius)
    ctx.quadraticCurveTo(rectX + rectWidth, rectY + rectHeight, rectX + rectWidth - radius, rectY + rectHeight)
    ctx.lineTo(rectX + radius, rectY + rectHeight)
    ctx.quadraticCurveTo(rectX, rectY + rectHeight, rectX, rectY + rectHeight - radius)
    ctx.lineTo(rectX, rectY + radius)
    ctx.quadraticCurveTo(rectX, rectY, rectX + radius, rectY)
    ctx.closePath()
    ctx.fill()
    
    // 艺术家名称文字
    ctx.fillStyle = '#1a4b8c'
    ctx.fillText(artistName, width * 0.5, height * 0.9)
    ctx.restore()

    // 添加 Power Station 标志
    this.drawPorcelainLogo(ctx, width * 0.92, height * 0.95, 45)

    return canvas
  }

  drawPorcelainPattern(ctx, x, y, size) {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(Math.random() * Math.PI * 2)
    
    // 绘制青花瓷纹样
    ctx.strokeStyle = '#1a4b8c'
    ctx.lineWidth = 0.5
    
    // 绘制云纹
    for (let i = 0; i < 3; i++) {
      ctx.beginPath()
      ctx.arc(0, i * 5, size/4 - i * 2, 0, Math.PI * 2)
      ctx.stroke()
    }
    
    // 绘制装饰线
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(Math.cos(angle) * size/2, Math.sin(angle) * size/2)
      ctx.stroke()
    }
    
    ctx.restore()
  }

  drawPorcelainDecoration(ctx, x, y, size) {
    ctx.save()
    ctx.translate(x, y)
    
    // 创建青花瓷风格渐变
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size)
    gradient.addColorStop(0, 'rgba(26, 75, 140, 0.3)')
    gradient.addColorStop(0.6, 'rgba(26, 75, 140, 0.1)')
    gradient.addColorStop(1, 'rgba(26, 75, 140, 0)')
    
    ctx.fillStyle = gradient
    
    // 创建青花瓷装饰图案
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 * i) / 5
      const distance = size/3
      ctx.save()
      ctx.rotate(angle)
      ctx.translate(distance, 0)
      
      // 绘制花瓣
      ctx.beginPath()
      ctx.moveTo(0, -size/6)
      ctx.quadraticCurveTo(size/4, 0, 0, size/6)
      ctx.quadraticCurveTo(-size/4, 0, 0, -size/6)
      ctx.fill()
      
      // 绘制装饰点
      ctx.beginPath()
      ctx.arc(0, 0, size/12, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.restore()
    }
    ctx.restore()
  }

  drawPorcelainLogo(ctx, x, y, size) {
    ctx.save()
    ctx.translate(x, y)
    
    // Logo 背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.08)'
    ctx.shadowBlur = 8
    
    // 绘制圆形背景
    ctx.beginPath()
    ctx.arc(0, 0, size * 0.8, 0, Math.PI * 2)
    ctx.fill()
    
    // 添加青花瓷风格装饰
    ctx.strokeStyle = '#1a4b8c'
    ctx.lineWidth = 0.8
    ctx.beginPath()
    ctx.arc(0, 0, size * 0.6, 0, Math.PI * 2)
    ctx.stroke()
    
    // Logo 文字
    ctx.fillStyle = '#1a4b8c'
    ctx.font = 'bold 16px "Ma Shan Zheng"'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('AIPAN', 0, 0)
    ctx.restore()
  }

  getTemplates() {
    return this.templates
  }

  async generatePoster(track, templateId = 'collage', options = {}) {
    const canvas = document.createElement('canvas')
    canvas.width = 1200
    canvas.height = 1600

    const template = this.templates.find(t => t.id === templateId)
    if (!template) {
      throw new Error('Template not found')
    }

    // 传递选项到生成函数
    return await template.generate(track, canvas, options)
  }
}

export default new PosterService() 