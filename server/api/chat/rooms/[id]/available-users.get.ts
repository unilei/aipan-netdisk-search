import jwt from 'jsonwebtoken'
import { H3Error } from 'h3'
import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    // 验证用户身份
    const token = getHeader(event, 'Authorization')?.replace('Bearer ', '')
    if (!token) {
      throw createError({
        statusCode: 401,
        message: '未授权访问'
      })
    }

    const jwtSecret = useRuntimeConfig().jwtSecret
    const decoded = jwt.verify(token, jwtSecret) as { userId: number }

    // 获取聊天室ID
    const roomId = parseInt(event.context.params?.id || '')
    if (isNaN(roomId)) {
      throw createError({
        statusCode: 400,
        message: '无效的聊天室ID'
      })
    }

    // 获取分页参数
    const query = getQuery(event)
    const page = parseInt(query.page as string || '1')
    const pageSize = parseInt(query.pageSize as string || '10')
    const search = (query.search as string || '').trim()

    // 验证用户是否有权限查看聊天室
    const userRoom = await prisma.chatRoomUser.findUnique({
      where: {
        userId_roomId: {
          userId: decoded.userId,
          roomId
        }
      }
    })

    if (!userRoom) {
      throw createError({
        statusCode: 403,
        message: '您不是该聊天室的成员'
      })
    }

    // 获取聊天室信息
    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        creator: true
      }
    })

    if (!room) {
      throw createError({
        statusCode: 404,
        message: '聊天室不存在'
      })
    }

    // 验证当前用户是否是创建者
    if (room.creatorId !== decoded.userId) {
      throw createError({
        statusCode: 403,
        message: '只有聊天室创建者可以邀请用户'
      })
    }

    // 获取当前聊天室的所有成员
    const roomMembers = await prisma.chatRoomUser.findMany({
      where: { roomId },
      select: { userId: true }
    })

    const memberIds = roomMembers.map((member: { userId: number }) => member.userId)

    // 构建查询条件
    const whereCondition: any = {
      id: {
        notIn: memberIds
      }
    }

    // 如果有搜索关键词，添加搜索条件
    if (search) {
      whereCondition.username = {
        contains: search
      }
    }

    // 获取总数，用于判断是否有更多用户
    const totalCount = await prisma.user.count({
      where: whereCondition
    })

    // 获取不在聊天室的用户
    const availableUsers = await prisma.user.findMany({
      where: whereCondition,
      select: {
        id: true,
        username: true
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: {
        username: 'asc' // 按用户名排序
      }
    })

    // 返回分页数据
    return {
      users: availableUsers,
      pagination: {
        page,
        pageSize,
        total: totalCount,
        hasMore: page * pageSize < totalCount
      }
    }

  } catch (error) {
    console.error('获取可邀请用户失败:', error)

    if (error instanceof H3Error) {
      throw error
    }

    if (error instanceof jwt.JsonWebTokenError) {
      throw createError({
        statusCode: 401,
        message: '无效的身份凭证'
      })
    }

    throw createError({
      statusCode: 500,
      message: '服务器错误'
    })
  }
})
