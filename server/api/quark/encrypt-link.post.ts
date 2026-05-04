import crypto from 'crypto'

// 使用时间戳和简单的加密方案
const SECRET_KEY = process.env.LINK_ENCRYPTION_KEY || 'aipan-secret-2024'

function encryptLink(link: string): string {
  const timestamp = Date.now()
  const data = JSON.stringify({ link, timestamp })
  
  // 使用Base64加上简单的异或加密
  const buffer = Buffer.from(data, 'utf8')
  const keyBuffer = Buffer.from(SECRET_KEY)
  
  for (let i = 0; i < buffer.length; i++) {
    const keyByte = keyBuffer[i % keyBuffer.length]
    const bufferByte = buffer[i]
    if (keyByte !== undefined && bufferByte !== undefined) {
      buffer[i] = bufferByte ^ keyByte
    }
  }
  
  return buffer.toString('base64')
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { link } = body

    if (!link || typeof link !== 'string') {
      return {
        code: 400,
        msg: '无效的链接参数'
      }
    }

    const token = encryptLink(link)

    return {
      code: 200,
      data: {
        token,
        expiresAt: Date.now() + 10 * 60 * 1000 // 10分钟过期
      }
    }
  } catch (error) {
    console.error('链接加密失败:', error)
    return {
      code: 500,
      msg: '链接加密失败'
    }
  }
})