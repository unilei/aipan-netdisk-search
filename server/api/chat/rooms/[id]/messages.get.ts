import prisma from '~/lib/prisma'

// 获取特定聊天室的消息列表
export default defineEventHandler(async (event) => {
  try {
    // 验证用户身份
    const user = event.context.user
    if (!user || !user.userId) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
        message: "请先登录"
      })
    }

    const roomId = Number(event.context.params?.id)
    if (isNaN(roomId)) {
      throw createError({
        statusCode: 400,
        message: '无效的聊天室ID'
      })
    }
    
    // 获取查询参数
    const query = getQuery(event)
    const limit = Number(query.limit) || 20
    const skip = Number(query.skip) || 0
    const before = query.before ? new Date(String(query.before)) : null
    const after = query.after ? new Date(String(query.after)) : null
    
    // 检查用户是否有权限访问该聊天室
    const userRoom = await prisma.chatRoomUser.findUnique({
      where: {
        userId_roomId: {
          userId: user.userId,
          roomId
        }
      }
    })
    
    if (!userRoom) {
      // 检查聊天室是否为公开的
      const room = await prisma.chatRoom.findUnique({
        where: { id: roomId }
      })
      
      if (!room || !room.isPublic) {
        throw createError({
          statusCode: 403,
          message: '您没有权限访问此聊天室'
        })
      }
    }
    
    // 构建查询条件
    const whereCondition: any = { roomId }
    
    if (before) {
      whereCondition.createdAt = { lt: before }
    } else if (after) {
      whereCondition.createdAt = { gt: after }
    }
    
    // 设置超时处理
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('数据库查询超时')), 5000)
    );
    
    // 获取消息
    const messagesPromise = prisma.chatMessage.findMany({
      where: whereCondition,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarStyle: true,
            role: true
          }
        },
        replyTo: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarStyle: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: skip,
      take: limit
    });
    
    // 使用Promise.race来处理超时
    const messages = await Promise.race([messagesPromise, timeout])
      .catch(error => {
        if (error.message === '数据库查询超时') {
          throw createError({
            statusCode: 504,
            message: '获取消息超时，请稍后再试'
          })
        }
        throw error;
      });
    
    // 如果使用before查询，需要将结果逆序，因为我们想要的是"before之前的最新消息"
    const result = messages;
    
    // 将所有未读消息标记为已读（使用单独的Promise，不阻塞主流程）
    Promise.resolve().then(async () => {
      try {
        await prisma.chatMessage.updateMany({
          where: {
            roomId,
            userId: { not: user.userId },
            isRead: false
          },
          data: {
            isRead: true
          }
        });
      } catch (error) {
        console.error('标记消息已读失败:', error);
      }
    });
    
    return result
  } catch (error: any) {
    console.error('获取消息列表失败:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '获取消息列表失败'
    })
  }
})
