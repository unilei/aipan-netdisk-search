import { PrismaClient } from '@prisma/client'
import { verifyToken } from '~/server/model/user'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  // 验证用户是否已登录并且是管理员
  const { token } = parseCookies(event)
  const decoded = token ? verifyToken(token) : null
  
  if (!decoded || !decoded.userId || decoded.role !== 'admin') {
    throw createError({
      statusCode: 401,
      message: '未授权的访问'
    })
  }

  try {
    // 获取查询参数
    const query = getQuery(event)
    const page = Number(query.page) || 1
    const pageSize = Number(query.pageSize) || 10
    const search = query.search as string || ''
    const type = query.type as string || undefined
    const isPublic = query.isPublic !== undefined ? query.isPublic === 'true' : undefined

    // 构建查询条件
    const where = {
      ...(search ? {
        OR: [
          { name: { contains: search } },
          { description: { contains: search } }
        ]
      } : {}),
      ...(type ? { type } : {}),
      ...(isPublic !== undefined ? { isPublic } : {})
    }

    // 查询总数
    const total = await prisma.chatRoom.count({ where })

    // 查询聊天室列表
    const rooms = await prisma.chatRoom.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            // avatar属性在Prisma模型中可能不存在，使用avatarStyle代替
            avatarStyle: true
          }
        },
        _count: {
          select: {
            users: true,
            messages: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      skip: (page - 1) * pageSize,
      take: pageSize
    })

    // 格式化数据 - 使用类型断言解决TypeScript错误
    const formattedRooms = rooms.map((room: any) => {
      return {
        id: room.id,
        name: room.name,
        description: room.description,
        type: room.type,
        isPublic: room.isPublic,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
        creatorId: room.creatorId,
        creator: {
          id: room.creator.id,
          username: room.creator.username,
          // 使用avatarStyle替代avatar或创建一个虚拟的avatar属性
          avatar: null
        },
        memberCount: room._count.users,
        messageCount: room._count.messages
      };
    });

    return {
      data: formattedRooms,
      total,
      page,
      pageSize
    }
  } catch (error) {
    console.error('获取聊天室列表失败:', error)
    throw createError({
      statusCode: 500,
      message: '获取聊天室列表失败'
    })
  }
})
