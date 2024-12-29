import { PrismaClient } from '@prisma/client'

// 创建全局的 prisma 实例
const globalForPrisma = global as { prisma?: PrismaClient }
const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV === 'development') {
    globalForPrisma.prisma = prisma
}

export default prisma 