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
      {
        id: 'cyberpunk',
        name: '赛博朋克',
        generate: this.generateCyberpunkPoster.bind(this)
      },
      {
        id: 'anime',
        name: '动漫',
        generate: this.generateAnimePoster.bind(this)
      },
      {
        id: 'chinese',
        name: '中国风',
        generate: this.generateChinesePoster.bind(this)
      }
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
    ctx.fillText('', 0, 0)
    ctx.restore()
  }

  // 绘制故障艺术效果
  drawGlitchEffect(ctx, x, y, width, height) {
    const sliceHeight = height / 20
    for (let i = 0; i < 20; i++) {
      const sy = y + i * sliceHeight
      const offset = Math.random() * 10 - 5
      ctx.drawImage(
        ctx.canvas,
        x, sy, width, sliceHeight,
        x + offset, sy, width, sliceHeight
      )
    }
  }

  // 绘制网格背景
  drawCyberGrid(ctx, width, height) {
    // 主网格
    const gridSize = 40
    const perspective = 2.5

    // 绘制深色背景渐变
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height)
    bgGradient.addColorStop(0, '#000819')
    bgGradient.addColorStop(0.5, '#000B24')
    bgGradient.addColorStop(1, '#000819')
    ctx.fillStyle = bgGradient
    ctx.fillRect(0, 0, width, height)

    // 绘制远景网格
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)'
    ctx.lineWidth = 0.5

    // 垂直线
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    // 水平线带透视效果
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath()
      const startX = width / 2 - (width / 2) / Math.pow(y / height + 1, perspective)
      const endX = width / 2 + (width / 2) / Math.pow(y / height + 1, perspective)
      ctx.moveTo(startX, y)
      ctx.lineTo(endX, y)
      ctx.stroke()
    }

    // 绘制近景网格
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)'
    ctx.lineWidth = 1

    // 垂直线
    for (let x = 0; x <= width; x += gridSize * 2) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    // 水平线带透视效果
    for (let y = 0; y <= height; y += gridSize * 2) {
      ctx.beginPath()
      const startX = width / 2 - (width / 2) / Math.pow(y / height + 1, perspective - 0.5)
      const endX = width / 2 + (width / 2) / Math.pow(y / height + 1, perspective - 0.5)
      ctx.moveTo(startX, y)
      ctx.lineTo(endX, y)
      ctx.stroke()
    }
  }

  // 绘制霓虹文字效果
  drawNeonText(ctx, text, x, y, fontSize, color) {
    ctx.save()
    
    // 外发光基础层
    ctx.shadowBlur = 15
    ctx.shadowColor = color
    ctx.fillStyle = color
    ctx.font = `bold ${fontSize}px "Orbitron", sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    // 内发光层
    const innerGlow = color === '#ff00ff' ? '#ff99ff' : '#99ffff'
    ctx.fillStyle = innerGlow
    ctx.fillText(text, x, y)
    
    // 主颜色层
    ctx.fillStyle = color
    ctx.shadowBlur = 10
    ctx.fillText(text, x, y)
    
    // 外发光增强层
    ctx.shadowBlur = 20
    ctx.globalAlpha = 0.5
    ctx.fillText(text, x, y)
    
    // 最外层光晕
    ctx.shadowBlur = 30
    ctx.globalAlpha = 0.2
    ctx.fillText(text, x, y)
    
    ctx.restore()
  }

  async generateCyberpunkPoster(track, canvas, options = {}) {
    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height

    // 获取歌词
    const lyrics = await lyricsService.getLyrics(track)
    const previewLyrics = lyricsService.getPreviewLyrics(lyrics, 100, options.fullLyrics)

    // 添加网格背景
    this.drawCyberGrid(ctx, width, height)

    // 加载并绘制专辑封面（仅在非完整歌词模式下）
    const albumArt = await this.loadImage(track.albumArt)
    const artSize = Math.min(width * 0.5, height * 0.5)
    
    if (!options.fullLyrics) {
      // 绘制专辑封面并添加故障艺术效果
      ctx.save()
      ctx.translate(width * 0.5, height * 0.35)
      
      // 绘制发光边框
      ctx.shadowColor = '#00ffff'
      ctx.shadowBlur = 30
      ctx.strokeStyle = '#00ffff'
      ctx.lineWidth = 3
      ctx.strokeRect(-artSize/2 - 10, -artSize/2 - 10, artSize + 20, artSize + 20)
      
      // 内层边框
      ctx.strokeStyle = '#ff00ff'
      ctx.lineWidth = 1
      ctx.strokeRect(-artSize/2 - 5, -artSize/2 - 5, artSize + 10, artSize + 10)
      
      // 绘制专辑封面
      ctx.drawImage(albumArt, -artSize/2, -artSize/2, artSize, artSize)
      
      // 添加故障艺术效果
      this.drawGlitchEffect(ctx, -artSize/2, -artSize/2, artSize, artSize)
      ctx.restore()
    }

    // 绘制歌曲标题
    const titleY = options.fullLyrics ? height * 0.08 : height * 0.15
    this.drawNeonText(ctx, track.name, width * 0.5, titleY, 60, '#ff00ff')

    // 添加歌词
    if (previewLyrics) {
      ctx.save()
      const lyricsLines = previewLyrics.split('\n')
      
      if (options.fullLyrics) {
        // 动态计算字体大小
        const availableHeight = height * 0.75 // 减小可用高度，让整体更紧凑
        const lineSpacingRatio = 1.6 // 减小行间距
        const maxFontSize = 32
        const minFontSize = 18 // 增加最小字体大小
        
        let fontSize = Math.min(
          maxFontSize,
          Math.max(
            minFontSize,
            Math.floor(availableHeight / (lyricsLines.length * lineSpacingRatio))
          )
        )
        
        const lineHeight = fontSize * lineSpacingRatio
        const totalLyricsHeight = lineHeight * lyricsLines.length
        const startY = (height - totalLyricsHeight) / 2

        lyricsLines.forEach((line, index) => {
          const y = startY + index * lineHeight
          const color = index % 2 === 0 ? '#00ffff' : '#ff00ff'
          
          ctx.save()
          ctx.translate(width * 0.5, y)
          ctx.rotate(Math.random() * 0.006 - 0.003) // 减小随机旋转角度
          this.drawNeonText(ctx, `『${line}』`, 0, 0, fontSize, color)
          ctx.restore()
        })
      } else {
        let lyricsY = height * 0.6
        lyricsLines.forEach((line, index) => {
          const color = index % 2 === 0 ? '#00ffff' : '#ff00ff'
          this.drawNeonText(ctx, line, width * 0.5, lyricsY, 24, color)
          lyricsY += 40
        })
      }
      ctx.restore()
    }

    // 绘制艺术家名称
    const artistY = options.fullLyrics ? height * 0.95 : height * 0.85
    this.drawNeonText(ctx, track.artist, width * 0.5, artistY, 40, '#00ffff')

    // 添加装饰性元素
    ctx.save()
    
    // 左上角装饰
    this.drawNeonText(ctx, '◢', 50, 50, 40, '#ff00ff')
    // 右下角装饰
    this.drawNeonText(ctx, '◣', width - 50, height - 50, 40, '#00ffff')
    
    // 添加 AIPAN 标志
    this.drawNeonText(ctx, '', width - 80, 50, 24, '#00ffff')
    
    // 添加额外的赛博朋克装饰元素
    this.drawNeonText(ctx, '/', 30, 30, 30, '#ff00ff')
    this.drawNeonText(ctx, '\\', width - 30, height - 30, 30, '#00ffff')
    
    ctx.restore()

    return canvas
  }

  // 绘制动漫风格装饰
  drawAnimeDecoration(ctx, x, y, size, color) {
    ctx.save()
    ctx.translate(x, y)
    
    // 绘制星星
    const drawStar = (x, y, size, rotation = 0) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rotation)
      ctx.beginPath()
      for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2
        const point = i === 0 ? ctx.moveTo : ctx.lineTo
        point.call(ctx,
          Math.cos(angle) * size,
          Math.sin(angle) * size
        )
      }
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }

    // 绘制装饰性线条
    const drawCurve = () => {
      ctx.beginPath()
      ctx.moveTo(-size/2, 0)
      ctx.quadraticCurveTo(0, -size/2, size/2, 0)
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.stroke()
    }

    // 绘制多个星星
    ctx.fillStyle = color
    drawStar(0, 0, size/4)
    drawStar(-size/2, -size/2, size/6, Math.PI/4)
    drawStar(size/2, -size/2, size/6, -Math.PI/4)

    // 绘制装饰线条
    drawCurve()
    
    ctx.restore()
  }

  // 绘制动漫风格文字
  drawAnimeText(ctx, text, x, y, fontSize, color, options = {}) {
    ctx.save()
    
    // 文字阴影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
    ctx.shadowBlur = 5
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2
    
    // 主文字
    ctx.font = `bold ${fontSize}px "Noto Sans SC", sans-serif`
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    // 文字描边
    if (options.stroke) {
      ctx.strokeStyle = options.strokeColor || '#ffffff'
      ctx.lineWidth = options.strokeWidth || 4
      ctx.strokeText(text, x, y)
    }
    
    ctx.fillText(text, x, y)
    
    // 添加装饰性下划线
    if (options.underline) {
      const textWidth = ctx.measureText(text).width
      ctx.beginPath()
      ctx.moveTo(x - textWidth/2, y + fontSize/2)
      ctx.lineTo(x + textWidth/2, y + fontSize/2)
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.stroke()
    }
    
    ctx.restore()
  }

  async generateAnimePoster(track, canvas, options = {}) {
    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height

    // 获取歌词
    const lyrics = await lyricsService.getLyrics(track)
    const previewLyrics = lyricsService.getPreviewLyrics(lyrics, 100, options.fullLyrics)

    // 设置渐变背景
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, '#ffd1dc')  // 粉色
    gradient.addColorStop(0.5, '#fff0f5') // 浅粉色
    gradient.addColorStop(1, '#ffd1dc')  // 粉色
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // 添加装饰性图案
    for (let i = 0; i < 8; i++) {
      const x = Math.random() * width
      const y = Math.random() * height
      const size = Math.random() * 30 + 20
      const color = i % 2 === 0 ? '#ff69b4' : '#4169e1'
      this.drawAnimeDecoration(ctx, x, y, size, color)
    }

    // 加载并绘制专辑封面（仅在非完整歌词模式下）
    const albumArt = await this.loadImage(track.albumArt)
    const artSize = Math.min(width * 0.5, height * 0.5)
    
    if (!options.fullLyrics) {
      ctx.save()
      ctx.translate(width * 0.5, height * 0.35)
      
      // 绘制封面背景
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
      ctx.shadowBlur = 20
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(-artSize/2 - 10, -artSize/2 - 10, artSize + 20, artSize + 20)
      
      // 绘制专辑封面
      ctx.drawImage(albumArt, -artSize/2, -artSize/2, artSize, artSize)
      
      // 添加装饰性边框
      ctx.strokeStyle = '#ff69b4'
      ctx.lineWidth = 3
      ctx.strokeRect(-artSize/2 - 5, -artSize/2 - 5, artSize + 10, artSize + 10)
      
      ctx.restore()
    }

    // 绘制歌曲标题
    const titleY = options.fullLyrics ? height * 0.08 : height * 0.15
    this.drawAnimeText(ctx, track.name, width * 0.5, titleY, 60, '#ff1493', {
      stroke: true,
      strokeColor: '#ffffff',
      strokeWidth: 6
    })

    // 添加歌词
    if (previewLyrics) {
      ctx.save()
      const lyricsLines = previewLyrics.split('\n')
      
      if (options.fullLyrics) {
        // 动态计算字体大小
        const availableHeight = height * 0.75
        const lineSpacingRatio = 1.6
        const maxFontSize = 32
        const minFontSize = 18
        
        let fontSize = Math.min(
          maxFontSize,
          Math.max(
            minFontSize,
            Math.floor(availableHeight / (lyricsLines.length * lineSpacingRatio))
          )
        )
        
        const lineHeight = fontSize * lineSpacingRatio
        const totalLyricsHeight = lineHeight * lyricsLines.length
        const startY = (height - totalLyricsHeight) / 2

        lyricsLines.forEach((line, index) => {
          const y = startY + index * lineHeight
          const color = index % 2 === 0 ? '#4169e1' : '#ff1493'
          
          ctx.save()
          ctx.translate(width * 0.5, y)
          ctx.rotate(Math.random() * 0.006 - 0.003) // 减小随机旋转角度
          this.drawAnimeText(ctx, `❀ ${line} ❀`, 0, 0, fontSize, color, {
            stroke: true,
            strokeColor: '#ffffff',
            strokeWidth: 3
          })
          ctx.restore()
        })
      } else {
        let lyricsY = height * 0.6
        lyricsLines.forEach((line, index) => {
          const color = index % 2 === 0 ? '#4169e1' : '#ff1493'
          this.drawAnimeText(ctx, line, width * 0.5, lyricsY, 24, color, {
            stroke: true,
            strokeColor: '#ffffff',
            strokeWidth: 2
          })
          lyricsY += 40
        })
      }
      ctx.restore()
    }

    // 绘制艺术家名称
    const artistY = options.fullLyrics ? height * 0.95 : height * 0.85
    this.drawAnimeText(ctx, track.artist, width * 0.5, artistY, 40, '#4169e1', {
      stroke: true,
      strokeColor: '#ffffff',
      strokeWidth: 4,
      underline: true
    })

    // 添加装饰性元素
    ctx.save()
    
    // 左上角装饰
    this.drawAnimeDecoration(ctx, 80, 80, 60, '#ff69b4')
    // 右下角装饰
    this.drawAnimeDecoration(ctx, width - 80, height - 80, 60, '#4169e1')
    
    // 添加 AIPAN 标志
    this.drawAnimeText(ctx, '', width - 80, 50, 24, '#ff1493', {
      stroke: true,
      strokeColor: '#ffffff',
      strokeWidth: 2
    })
    
    ctx.restore()

    return canvas
  }

  // 绘制水墨效果
  drawInkEffect(ctx, x, y, size, color = 'rgba(0, 0, 0, 0.8)') {
    ctx.save()
    ctx.translate(x, y)

    // 创建水墨晕染效果
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size)
    gradient.addColorStop(0, color)
    gradient.addColorStop(0.6, `${color.slice(0, -4)}0.3)`)
    gradient.addColorStop(1, `${color.slice(0, -4)}0)`)

    ctx.fillStyle = gradient
    ctx.beginPath()
    
    // 创建不规则形状
    const points = []
    const numPoints = 12
    for (let i = 0; i < numPoints; i++) {
      const angle = (i * 2 * Math.PI) / numPoints
      const radius = size * (0.8 + Math.random() * 0.4)
      points.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
      })
    }

    // 绘制贝塞尔曲线
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i <= points.length; i++) {
      const p1 = points[i % points.length]
      const p2 = points[(i + 1) % points.length]
      const xc = (p1.x + p2.x) / 2
      const yc = (p1.y + p2.y) / 2
      ctx.quadraticCurveTo(p1.x, p1.y, xc, yc)
    }

    ctx.fill()
    ctx.restore()
  }

  // 绘制毛笔字效果
  drawBrushText(ctx, text, x, y, fontSize, color = '#000000', options = {}) {
    ctx.save()
    
    // 设置字体和样式
    ctx.font = `${fontSize}px "Ma Shan Zheng", "Noto Serif SC", serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // 绘制主要文字
    if (options.inkEffect) {
      // 创建墨晕效果
      const gradient = ctx.createLinearGradient(x, y - fontSize/2, x, y + fontSize/2)
      
      // 处理颜色转换
      let baseColor, alpha
      if (color.startsWith('rgba')) {
        const matches = color.match(/rgba\(([\d,\s]+),\s*([\d.]+)\)/)
        if (matches) {
          baseColor = `rgba(${matches[1]}, `
          alpha = matches[2]
        } else {
          baseColor = 'rgba(0, 0, 0, '
          alpha = '1'
        }
      } else {
        // 将 hex 转换为 rgb
        const r = parseInt(color.slice(1, 3), 16)
        const g = parseInt(color.slice(3, 5), 16)
        const b = parseInt(color.slice(5, 7), 16)
        baseColor = `rgba(${r}, ${g}, ${b}, `
        alpha = '1'
      }
      
      gradient.addColorStop(0, baseColor + alpha + ')')
      gradient.addColorStop(0.5, baseColor + alpha + ')')
      gradient.addColorStop(1, baseColor + '0.7)')
      
      ctx.fillStyle = gradient
    } else {
      ctx.fillStyle = color
    }

    // 添加书法效果的微小随机偏移
    const chars = text.split('')
    let totalWidth = 0
    chars.forEach(char => {
      totalWidth += ctx.measureText(char).width
    })
    
    let offsetX = -totalWidth / 2
    
    chars.forEach(char => {
      const charWidth = ctx.measureText(char).width
      const randX = Math.random() * 1 - 0.5  // 进一步减小随机偏移
      const randY = Math.random() * 1 - 0.5
      const rotation = (Math.random() * 2 - 1) * Math.PI / 180  // 进一步减小随机旋转
      
      ctx.save()
      ctx.translate(x + offsetX + charWidth/2, y)
      ctx.rotate(rotation)
      ctx.fillText(char, randX, randY)
      ctx.restore()
      
      offsetX += charWidth + fontSize * 0.1  // 添加固定的字间距
    })

    // 添加装饰性点缀
    if (options.decorative) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.8)'
      ctx.beginPath()
      ctx.arc(x + offsetX - fontSize * 0.3, y, fontSize * 0.08, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  }

  async generateChinesePoster(track, canvas, options = {}) {
    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height

    // 获取歌词
    const lyrics = await lyricsService.getLyrics(track)
    const previewLyrics = lyricsService.getPreviewLyrics(lyrics, 100, options.fullLyrics)

    // 设置米色背景
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, '#f9f4e6')
    gradient.addColorStop(0.5, '#f5efe0')
    gradient.addColorStop(1, '#f2ebd9')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // 加载并绘制专辑封面（仅在非完整歌词模式下）
    const albumArt = await this.loadImage(track.albumArt)
    const artSize = Math.min(width * 0.45, height * 0.45)
    
    if (!options.fullLyrics) {
      ctx.save()
      ctx.translate(width * 0.5, height * 0.35)
      
      // 绘制简洁的边框
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)'
      ctx.shadowBlur = 10
      ctx.fillStyle = '#fff'
      ctx.fillRect(-artSize/2 - 15, -artSize/2 - 15, artSize + 30, artSize + 30)
      
      // 绘制专辑封面
      ctx.drawImage(albumArt, -artSize/2, -artSize/2, artSize, artSize)
      
      // 添加细边框
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)'
      ctx.lineWidth = 1
      ctx.strokeRect(-artSize/2 - 5, -artSize/2 - 5, artSize + 10, artSize + 10)
      
      ctx.restore()

      // 绘制歌曲标题（非完整歌词模式）
      this.drawBrushText(ctx, track.name, width * 0.5, height * 0.15, 72, '#000000', {
        inkEffect: true,
        decorative: true
      })

      // 绘制艺术家名称（非完整歌词模式）
      this.drawBrushText(ctx, track.artist, width * 0.5, height * 0.85, 48, '#000000', {
        inkEffect: true,
        decorative: true
      })
    } else {
      // 完整歌词模式下的标题布局
      // 绘制歌曲标题（左侧）
      this.drawBrushText(ctx, track.name, width * 0.2, height * 0.08, 48, '#000000', {
        inkEffect: true,
        decorative: true
      })

      // 绘制艺术家名称（右侧）
      this.drawBrushText(ctx, track.artist, width * 0.8, height * 0.08, 48, '#000000', {
        inkEffect: true,
        decorative: true
      })
    }

    // 添加歌词
    if (previewLyrics) {
      ctx.save()
      const lyricsLines = previewLyrics.split('\n')
      
      if (options.fullLyrics) {
        // 动态计算字体大小
        const availableHeight = height * 0.75  // 增加可用高度
        const lineSpacingRatio = 2.5
        const maxFontSize = 28
        const minFontSize = 20
        
        let fontSize = Math.min(
          maxFontSize,
          Math.max(
            minFontSize,
            Math.floor(availableHeight / (lyricsLines.length * lineSpacingRatio))
          )
        )
        
        const lineHeight = fontSize * lineSpacingRatio
        const totalLyricsHeight = lineHeight * lyricsLines.length
        const startY = (height - totalLyricsHeight) / 2 + fontSize

        lyricsLines.forEach((line, index) => {
          const y = startY + index * lineHeight
          
          ctx.save()
          ctx.translate(width * 0.5, y)
          const displayText = line.length > 10 ? line : `「${line}」`
          this.drawBrushText(ctx, displayText, 0, 0, fontSize, 'rgba(0, 0, 0, 0.85)', {
            inkEffect: true
          })
          ctx.restore()
        })
      } else {
        let lyricsY = height * 0.6
        lyricsLines.forEach((line, index) => {
          this.drawBrushText(ctx, line, width * 0.5, lyricsY, 28, 'rgba(0, 0, 0, 0.85)', {
            inkEffect: true
          })
          lyricsY += 70
        })
      }
      ctx.restore()
    }

    // 添加 AIPAN 标志
    this.drawBrushText(ctx, '', width - 80, 50, 24, '#000000', {
      inkEffect: true
    })

    return canvas
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