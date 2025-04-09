import prisma from '~/lib/prisma'

// 获取用户的聊天室列表
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

    // 根据查询参数决定是获取所有公开聊天室还是用户加入的聊天室
    const query = getQuery(event)
    const showPublic = query.public === 'true'
    
    let chatRooms = []
    
    if (showPublic) {
      // 获取所有公开聊天室
      chatRooms = await prisma.chatRoom.findMany({
        where: {
          isPublic: true
        },
        include: {
          users: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatarStyle: true
                }
              }
            }
          },
          creator: {
            select: {
              id: true,
              username: true,
              avatarStyle: true
            }
          },
          _count: {
            select: {
              messages: true
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        }
      })
    } else {
      // 获取用户加入的聊天室
      const userRooms = await prisma.chatRoomUser.findMany({
        where: {
          userId: user.userId
        },
        include: {
          room: {
            include: {
              users: {
                include: {
                  user: {
                    select: {
                      id: true,
                      username: true,
                      avatarStyle: true
                    }
                  }
                }
              },
              creator: {
                select: {
                  id: true,
                  username: true,
                  avatarStyle: true
                }
              },
              _count: {
                select: {
                  messages: true
                }
              }
            }
          }
        },
        orderBy: {
          room: {
            updatedAt: 'desc'
          }
        }
      })
      
      chatRooms = userRooms.map((ur: any) => ur.room)
    }
    
    // 格式化数据以便前端使用
    return chatRooms.map((room: any) => ({
      id: room.id,
      name: room.name,
      description: room.description,
      type: room.type,
      isPublic: room.isPublic,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      creator: room.creator,
      memberCount: room.users.length,
      messageCount: room._count.messages,
      // 对于私聊，如果聊天室名称是自动生成的，则显示对方用户名
      displayName: room.type === 'private' && room.name.startsWith('private_') 
        ? room.users.find((u: any) => u.user.id !== user.userId)?.user?.username || room.name
        : room.name
    }))
  } catch (error: any) {
    console.error('获取聊天室列表失败:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '获取聊天室列表失败'
    })
  }
})
