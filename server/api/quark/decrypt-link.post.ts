import crypto from 'crypto'

// 使用时间戳和简单的加密方案
const SECRET_KEY = process.env.LINK_ENCRYPTION_KEY || 'aipan-secret-2024'
const MAX_AGE = 10 * 60 * 1000 // 10分钟

function decryptLink(token: string): { link: string; timestamp: number } | null {
  try {
    // Base64解码和简单的异或解密
    const buffer = Buffer.from(token, 'base64')
    const keyBuffer = Buffer.from(SECRET_KEY)
    
    for (let i = 0; i < buffer.length; i++) {
      const keyByte = keyBuffer[i % keyBuffer.length]
      const bufferByte = buffer[i]
      if (keyByte !== undefined && bufferByte !== undefined) {
        buffer[i] = bufferByte ^ keyByte
      }
    }
    
    const data = JSON.parse(buffer.toString('utf8'))
    return data
  } catch (error) {
    return null
  }
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { token } = body

    if (!token || typeof token !== 'string') {
      return {
        code: 400,
        msg: '无效的令牌参数'
      }
    }

    const decrypted = decryptLink(token)
    
    if (!decrypted) {
      return {
        code: 400,
        msg: '无效的令牌格式'
      }
    }
    
    // 检查是否过期
    const now = Date.now()
    if (now - decrypted.timestamp > MAX_AGE) {
      return {
        code: 400,
        msg: '令牌已过期'
      }
    }

    return {
      code: 200,
      data: {
        link: decrypted.link
      }
    }
  } catch (error) {
    console.error('链接解密失败:', error)
    return {
      code: 500,
      msg: '链接解密失败'
    }
  }
})