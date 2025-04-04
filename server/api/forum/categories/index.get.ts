import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
    try {
        const categories = await prisma.forumCategory.findMany({
            orderBy: {
                order: 'asc'
            },
            include: {
                _count: {
                    select: {
                        topics: true
                    }
                }
            }
        })

        return {
            success: true,
            data: categories
        }
    } catch (error) {
        console.error('获取论坛分类失败:', error)
        return {
            success: false,
            message: '获取论坛分类失败'
        }
    }
}) 