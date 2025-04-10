import { Socket, io } from 'socket.io-client'
import { useUserStore } from '~/stores/user'

let socket: Socket | null = null

export const useSocketIo = () => {
  const userStore = useUserStore()
  const config = useRuntimeConfig()

  // 初始化Socket连接
  const initSocket = () => {
    if (process.server) return null
    if (socket) return socket

    const token = userStore.token
    if (!token) return null

    // 动态获取WebSocket服务器地址
    let wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
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
      // 生产环境使用路径
      wsUrl = `${wsProtocol}//${window.location.host}/ws`
    }
    
    console.log('Connecting to WebSocket server at:', wsUrl)
    
    socket = io(wsUrl, {
      auth: {
        token
      },
      transports: ['websocket']
    })

    socket.on('connect', () => {
      console.log('WebSocket connected')
    })

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
    })

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected')
    })

    socket.on('error', (error: any) => {
      console.error('WebSocket error:', error)
    })

    return socket
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
    
    return new Promise((resolve, reject) => {
      socket?.emit('send_message', {
        roomId: roomId.toString(),
        message,
        replyTo: replyToId
      })

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
