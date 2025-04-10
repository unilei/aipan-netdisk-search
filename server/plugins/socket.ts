import { Server } from 'socket.io';
import { verifyToken } from '../model/user';
import { createServer } from 'node:http';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

// 定义聊天室接口
interface ChatRoom {
  id: number;
  name: string;
  type: string;
  isPublic: boolean;
}

let io: Server | null = null;

export default defineNitroPlugin((nitroApp) => {
  const config = useRuntimeConfig();

  if (process.server) {
    // 创建一个独立的HTTP服务器
    const httpServer = createServer();

    // 创建Socket.IO服务器
    io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true
      },
      serveClient: false,
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      pingTimeout: 30000,
      pingInterval: 25000
    });

    // 配置Redis适配器
    const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
    const pubClient = createClient({ url: REDIS_URL });
    const subClient = pubClient.duplicate();

    // 处理Redis连接错误
    pubClient.on('error', (err) => {
      console.error('Redis Pub Client Error:', err);
    });
    
    subClient.on('error', (err) => {
      console.error('Redis Sub Client Error:', err);
    });

    // 连接Redis并设置适配器
    Promise.all([pubClient.connect(), subClient.connect()])
      .then(() => {
        console.log('Redis adapter connected successfully');
        io?.adapter(createAdapter(pubClient, subClient));
      })
      .catch((err) => {
        console.error('Redis connection failed:', err);
        console.log('Continuing with default in-memory adapter');
      });

    // 在独立端口上启动WebSocket服务器
    const WS_PORT = parseInt(process.env.WS_PORT || '3002', 10);
    httpServer.listen(WS_PORT, '0.0.0.0', () => {
      console.log(`WebSocket服务器运行在端口 ${WS_PORT}，监听所有网络接口`);
    });

    // Store online users
    const onlineUsers = new Map();

    // Authentication middleware
    if (io) {
      io.use(async (socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error: Token required'));
        }

        const decoded = verifyToken(token);
        if (!decoded) {
          return next(new Error('Authentication error: Invalid token'));
        }

        socket.data.user = decoded;
        next();
      });
    }

    // Handle connection
    if (io) {
      io.on('connection', (socket) => {
        const userId = socket.data.user.userId;
        const username = socket.data.user.username || '用户';
        console.log(`User connected: ${userId} (${username})`);

        // Add user to online users map
        onlineUsers.set(userId, {
          socketId: socket.id,
          userId: userId,
          username: username
        });

        // Emit updated online users list to all clients
        if (io) {
          io.emit('users_online', Array.from(onlineUsers.values()));
        }

        // Join a room
        socket.on('join_room', async (roomId) => {
          socket.join(roomId);
          console.log(`User ${userId} (${username}) joined room ${roomId}`);

          // 检查用户是否已经是聊天室成员，如果不是且聊天室是公开的，则自动添加
          try {
            const prisma = await import('~/lib/prisma').then(m => m.default);

            // 检查用户是否已经是聊天室成员
            const userRoom = await prisma.chatRoomUser.findUnique({
              where: {
                userId_roomId: {
                  userId: userId,
                  roomId: parseInt(roomId, 10)
                }
              }
            });

            // 如果不是成员，检查聊天室是否公开
            if (!userRoom) {
              const room = await prisma.chatRoom.findUnique({
                where: { id: parseInt(roomId, 10) }
              });

              // 如果是公开聊天室，自动将用户添加为成员
              if (room && room.isPublic) {
                await prisma.chatRoomUser.create({
                  data: {
                    userId: userId,
                    roomId: parseInt(roomId, 10),
                    role: 'member'
                  }
                });
                console.log(`User ${userId} (${username}) automatically added to room ${roomId}`);
              }
            }
          } catch (error) {
            console.error('Error checking/adding user to room:', error);
          }

          // Notify room that a new user joined
          socket.to(roomId).emit('user_joined', {
            userId: userId,
            username: username
          });
        });

        // Leave a room
        socket.on('leave_room', (roomId) => {
          socket.leave(roomId);
          console.log(`User ${userId} (${username}) left room ${roomId}`);
          // Notify room that a user left
          socket.to(roomId).emit('user_left', {
            userId: userId,
            username: username
          });
        });

        // Send message
        socket.on('send_message', async (data) => {
          const { roomId, message, replyTo } = data;
          console.log(`收到消息请求: 用户${userId}(${username}) 发送到房间 ${roomId}:`, message);

          try {
            // Store message in database through the API
            const response = await $fetch(`/api/chat/messages`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${socket.handshake.auth.token}`
              },
              body: {
                roomId: roomId,
                content: message,
                replyToId: replyTo || null
              }
            });

            console.log(`消息已保存到数据库，正在广播到房间 ${roomId}`);
            
            // Broadcast message to room
            if (io) {
              io.to(roomId).emit('receive_message', response);
              console.log(`消息已广播到房间 ${roomId}的所有成员`);
            }
          } catch (error) {
            console.error('Error sending message:', error);
            socket.emit('error', 'Failed to send message');
          }
        });

        // Handle private message
        socket.on('private_message', async (data) => {
          const { recipientId, message } = data;
          const senderId = userId;

          // Get recipient socket
          const recipientSocket = onlineUsers.get(recipientId)?.socketId;

          try {
            // Create or get private room
            const roomIds = [senderId, recipientId].sort();
            const privateRoomId = `private_${roomIds[0]}_${roomIds[1]}`;

            // Check if the room exists, if not create it
            let room: ChatRoom | null = null;
            try {
              room = await $fetch<ChatRoom>(`/api/chat/rooms/${privateRoomId}`, {
                headers: {
                  Authorization: `Bearer ${socket.handshake.auth.token}`
                },
                method: 'GET'
              });
            } catch (error) {
              console.log('Private room not found, creating one');
            }

            if (!room) {
              // Create the private room
              room = await $fetch<ChatRoom>(`/api/chat/rooms`, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${socket.handshake.auth.token}`
                },
                body: {
                  name: privateRoomId,
                  type: 'private',
                  isPublic: false,
                  userIds: [recipientId]
                }
              });
            }

            if (!room || !room.id) {
              throw new Error('Failed to create or find private room');
            }

            // Store message in database
            const response = await $fetch(`/api/chat/messages`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${socket.handshake.auth.token}`
              },
              body: {
                roomId: room.id,
                content: message
              }
            });

            // Send message to sender
            socket.emit('receive_message', response);

            // Send message to recipient if online
            if (recipientSocket && io) {
              io.to(recipientSocket).emit('receive_message', response);
            }

            // Send notification to recipient if online
            if (recipientSocket && io) {
              io.to(recipientSocket).emit('new_message_notification', {
                from: {
                  userId: senderId,
                  username: username
                },
                message: message,
                roomId: room.id
              });
            }
          } catch (error) {
            console.error('Error sending private message:', error);
            socket.emit('error', 'Failed to send private message');
          }
        });

        // Handle typing status
        socket.on('typing', (data) => {
          const { roomId, isTyping } = data;

          socket.to(roomId).emit('user_typing', {
            userId: userId,
            username: username,
            isTyping
          });
        });

        // Handle disconnection
        socket.on('disconnect', () => {
          console.log(`User disconnected: ${userId} (${username})`);

          // Remove user from online users
          onlineUsers.delete(userId);

          // Emit updated online users list
          if (io) {
            io.emit('users_online', Array.from(onlineUsers.values()));
          }
        });
      });
    }
  }

  // 添加API路由处理程序，提供WebSocket服务器信息
  nitroApp.hooks.hook('request', (event) => {
    event.context.io = io;
  });
});
