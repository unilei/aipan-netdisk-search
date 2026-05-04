import { Socket, io } from 'socket.io-client'
import { useUserStore } from '~/stores/user'

let socket: Socket | null = null

export const useSocketIo = () => {
  const userStore = useUserStore()
  const config = useRuntimeConfig()

  // 初始化Socket连接
  const initSocket = () => {
    if (process.server) return null
    
    // 如果已有连接，检查是否连接状态
    if (socket) {
      if (socket.connected) {
        console.log('Socket已连接，复用现有连接')
        return socket
      } else {
        console.log('Socket存在但未连接，重新初始化')
        socket.disconnect()
        socket.removeAllListeners()
        socket = null
      }
    }

    const token = userStore.token
    if (!token) {
      console.error('未找到有效token，无法连接WebSocket')
      return null
    }

    // 动态获取WebSocket服务器地址
    let wsProtocol = 'ws:' // 强制使用非安全WebSocket
    let wsHost = window.location.hostname
    let wsPort = config.public.WS_PORT || '3002'
    
    // 如果在开发环境中
    if (process.dev) {
      wsProtocol = 'ws:'
      wsHost = 'localhost'
      wsPort = '3002'
    }
    
    // 根据环境选择不同的WebSocket连接URL
    let wsUrl = ""
    if (process.dev) {
      // 开发环境使用端口
      wsUrl = `${wsProtocol}//${wsHost}:${wsPort}`
    } else {
      // 生产环境通过Nginx代理使用SSL
      wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      wsUrl = `${wsProtocol}//${window.location.host}`
    }
    
    console.log('Connecting to WebSocket server at:', wsUrl)
    
    try {
      socket = io(wsUrl, {
        auth: {
          token
        },
        path: '/socket.io',
        transports: ['websocket'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000
      });

      socket.on('connect', () => {
        console.log('WebSocket connected, socket id:', socket?.id)
      });

      socket.on('connect_error', (error) => {
        console.error('WebSocket连接错误:', error.message)
      });

      socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected, reason:', reason)
      });

      socket.on('error', (error: any) => {
        console.error('WebSocket error:', error)
      });

      // 添加接收消息的调试
      socket.on('receive_message', (data) => {
        console.log('收到消息:', data)
      })

      // 添加其他事件监听
      socket.on('user_joined', (data) => {
        console.log('用户加入:', data)
      })

      socket.on('user_left', (data) => {
        console.log('用户离开:', data)
      })

      return socket
    } catch (err) {
      console.error('创建WebSocket连接失败:', err)
      return null
    }
  }

  // 关闭Socket连接
  const closeSocket = () => {
    if (socket) {
      socket.disconnect()
      socket = null
    }
  }

  // 加入聊天室
  const joinRoom = (roomId: string | number) => {
    if (!socket) return
    socket.emit('join_room', roomId.toString())
  }

  // 离开聊天室
  const leaveRoom = (roomId: string | number) => {
    if (!socket) return
    socket.emit('leave_room', roomId.toString())
  }

  // 发送消息
  const sendMessage = (roomId: string | number, message: string, replyToId?: number) => {
    if (!socket) return
    
    console.log('正在发送消息:', { roomId, message, replyToId })
    
    return new Promise((resolve, reject) => {
      socket?.emit('send_message', {
        roomId: roomId.toString(),
        message,
        replyTo: replyToId
      })

      console.log('消息已发送到服务器')

      // 仅用于立即响应UI，实际消息会通过事件监听器接收
      resolve({
        sent: true,
        timestamp: new Date()
      })
    })
  }

  // 发送私聊消息
  const sendPrivateMessage = (recipientId: number, message: string) => {
    if (!socket) return
    
    return new Promise((resolve, reject) => {
      socket?.emit('private_message', {
        recipientId,
        message
      })

      resolve({
        sent: true,
        timestamp: new Date()
      })
    })
  }

  // 发送输入状态
  const sendTypingStatus = (roomId: string | number, isTyping: boolean) => {
    if (!socket) return
    
    socket.emit('typing', {
      roomId: roomId.toString(),
      isTyping
    })
  }

  // 获取当前连接的Socket
  const getSocket = () => socket

  return {
    initSocket,
    closeSocket,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendPrivateMessage,
    sendTypingStatus,
    getSocket
  }
}
