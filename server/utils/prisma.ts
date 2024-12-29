import { PrismaClient } from '@prisma/client'

declare global {
    var prisma: PrismaClient | undefined
}

// 创建全局的 prisma 实例
const prisma = global.prisma || new PrismaClient()

if (process.env.NODE_ENV === 'development') {
    global.prisma = prisma
}

export default prisma 