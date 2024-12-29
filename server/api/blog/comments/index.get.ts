import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event)
        const page = parseInt(query.page as string) || 1
        const pageSize = parseInt(query.pageSize as string) || 10
        const keyword = query.keyword as string || ''
        const searchType = query.searchType as string || 'content'

        // 构建搜索条件
        const whereCondition: any = {}
        if (keyword) {
            switch (searchType) {
                case 'content':
                    whereCondition.content = {
                        contains: keyword
                    }
                    break
                case 'author':
                    whereCondition.author = {
                        contains: keyword
                    }
                    break
                case 'email':
                    whereCondition.email = {
                        contains: keyword
                    }
                    break
            }
        }

        // 获取总评论数
        const total = await prisma.comment.count({
            where: whereCondition
        })

        // 获取评论列表
        const comments = await prisma.comment.findMany({
            where: whereCondition,
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                replies: true
            }
        })

        return {
            code: 200,
            message: 'Comments retrieved successfully',
            data: {
                comments,
                total,
                page,
                pageSize
            }
        }
    } catch (error) {
        console.error('Error fetching comments:', error)
        return {
            code: 500,
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}) 