import prisma from '~/lib/prisma'

// 创建一个新的聊天室
export default defineEventHandler(async (event) => {
  try {
    

    const { name, description, type, isPublic, userIds: rawUserIds } = await readBody(event)
    const user = event.context.user
    if (!user || !user.userId) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
        message: "请先登录"
      })
    }
    // 验证必要字段
    if (!name || !type) {
      throw createError({
        statusCode: 400,
        message: '聊天室名称和类型为必填项'
      })
    }

    if (type === 'private') {
      throw createError({
        statusCode: 403,
        message: '请通过私信入口发起私聊'
      })
    }
    
    // 确保userIds是数字数组
    const userIds = rawUserIds ? rawUserIds.map((id: any) => 
      typeof id === 'string' ? parseInt(id, 10) : id
    ) : [];
    
    // 创建聊天室
    const chatRoom = await prisma.chatRoom.create({
      data: {
        name,
        description,
        type,
        isPublic: isPublic || false,
        creator: {
          connect: { id: user.userId }
        }
      }
    })
    
    // 将创建者添加为聊天室成员(管理员)
    await prisma.chatRoomUser.create({
      data: {
        userId: user.userId,
        roomId: chatRoom.id,
        role: 'admin'
      }
    })
    
    // 如果有指定其他用户，将他们添加为聊天室成员
    if (userIds && userIds.length > 0) {
      const userEntries = userIds.map((userId: number) => ({
        userId,
        roomId: chatRoom.id,
        role: 'member'
      }))
      
      await prisma.chatRoomUser.createMany({
        data: userEntries
      })
    }
    
    // 返回创建的聊天室
    return {
      id: chatRoom.id,
      name: chatRoom.name,
      description: chatRoom.description,
      type: chatRoom.type,
      isPublic: chatRoom.isPublic,
      createdAt: chatRoom.createdAt
    }
  } catch (error: any) {
    console.error('创建聊天室失败:', error)
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      message: `创建聊天室失败: ${error.message}`
    })
  }
})
