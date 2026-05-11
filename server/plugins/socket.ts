import { Server } from 'socket.io';
import { verifyToken } from '../model/user';
import { createServer } from 'node:http';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { createRoom, joinRoom, getRoomById, getRooms, leaveRoom } from '../services/roomService';

// 定义聊天室接口
interface ChatRoom {
  id: number;
  name: string;
  type: string;
  isPublic: boolean;
}

let io: Server | null = null;
const normalizeRedisUrl = (value?: string) => value?.trim().replace(/^['"]|['"]$/g, '') || '';
const REDIS_CONNECT_TIMEOUT_MS = 1000;

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
    const REDIS_URL = normalizeRedisUrl(process.env.REDIS_URL);

    if (REDIS_URL) {
      const pubClient = createClient({
        url: REDIS_URL,
        socket: {
          connectTimeout: REDIS_CONNECT_TIMEOUT_MS,
          reconnectStrategy: false,
        },
      });
      const subClient = pubClient.duplicate();

      let hasLoggedRedisPubError = false;
      let hasLoggedRedisSubError = false;

      // 处理Redis连接错误
      pubClient.on('error', (err) => {
        if (hasLoggedRedisPubError) {
          return;
        }

        hasLoggedRedisPubError = true;
        console.warn('Redis Pub Client Error:', err);
      });

      subClient.on('error', (err) => {
        if (hasLoggedRedisSubError) {
          return;
        }

        hasLoggedRedisSubError = true;
        console.warn('Redis Sub Client Error:', err);
      });

      // 连接Redis并设置适配器
      Promise.all([pubClient.connect(), subClient.connect()])
        .then(() => {
          console.log('Redis adapter connected successfully');
          io?.adapter(createAdapter(pubClient, subClient));
        })
        .catch((err) => {
          console.warn(`Redis connection failed for Socket.IO adapter (${REDIS_URL}). Continuing with default in-memory adapter.`, err);
        });
    } else {
      console.log('REDIS_URL is not configured. Continuing with default in-memory adapter.');
    }

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
        socket.join(`user:${userId}`);

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

        // 获取房间内所有用户及其socketId
        socket.on('get_room_users', (roomId) => {
          console.log(`用户 ${userId} 请求获取房间 ${roomId} 所有用户信息`);
          
          const roomUsers = [];
          
          if (io) {
            const room = io.sockets.adapter.rooms.get(roomId);
            
            if (room) {
              // 遍历房间内所有socket
              for (const socketId of room) {
                const userSocket = io.sockets.sockets.get(socketId);
                if (userSocket && userSocket.data.user) {
                  roomUsers.push({
                    userId: userSocket.data.user.id,
                    socketId: socketId,
                    username: userSocket.data.user.username
                  });
                }
              }
            }
          }
          
          console.log(`房间 ${roomId} 的用户列表:`, roomUsers);
          socket.emit('room_users', roomUsers);
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

        // 屏幕共享相关处理
        // 创建屏幕共享房间
        socket.on('create_room', (data, callback) => {
          const { roomName } = data;
          const room = createRoom(userId, roomName);
          socket.join(room.id);
          console.log(`用户 ${userId} (${username}) 创建了屏幕共享房间: ${room.id}, 房间名: ${roomName}`);
          
          // 修改返回格式以符合客户端期望
          socket.emit('room_created', {
            id: room.id,
            name: room.name,
            hostId: room.hostId,
            viewers: []
          });
        });
        
        // 加入屏幕共享房间
        socket.on('join_room', (roomId) => {
          console.log(`用户 ${userId} (${username}) 尝试加入屏幕共享房间: ${roomId}`);
          const room = joinRoom(roomId, userId);
          
          if (room) {
            socket.join(roomId);
            console.log(`用户 ${userId} (${username}) 成功加入了屏幕共享房间: ${roomId}`);
            
            // 添加socketId到userId的映射
            socket.data.roomId = roomId;
            
            // 通知房间内所有其他用户有新用户加入
            socket.to(roomId).emit('user_joined', {
              userId,
              username,
              socketId: socket.id
            });
            
            // 向加入者发送房间信息
            socket.emit('room_joined', {
              id: room.id,
              name: room.name,
              hostId: room.hostId,
              viewers: room.viewers || []
            });
            
            // 向所有房间用户广播socketId映射
            const roomUsers = [];
            if (io) {
              const sockets = io.sockets.adapter.rooms.get(roomId);
              if (sockets) {
                for (const socketId of sockets) {
                  const userSocket = io.sockets.sockets.get(socketId);
                  if (userSocket && userSocket.data.user) {
                    roomUsers.push({
                      userId: userSocket.data.user.userId,
                      socketId: socketId,
                      username: userSocket.data.user.username
                    });
                  }
                }
              }
              
              // 立即广播给房间内所有用户
              io.to(roomId).emit('room_users', roomUsers);
            }
          } else {
            socket.emit('error', { message: '房间不存在或已关闭' });
          }
        });
        
        // 离开屏幕共享房间
        socket.on('leave_room', (roomId) => {
          const room = leaveRoom(roomId, userId);
          
          if (room) {
            socket.leave(roomId);
            console.log(`用户 ${userId} (${username}) 离开了屏幕共享房间: ${roomId}`);
            
            // 通知房间内其他用户
            socket.to(roomId).emit('user_left', {
              userId,
              username
            });
          }
        });
        
        // 处理WebRTC信令
        socket.on('signal', (data) => {
          const { to, signal } = data;
          console.log(`用户 ${userId} 发送信令到用户 ${to}，信令类型:`, signal.type);
          
          socket.to(to).emit('signal', {
            from: socket.id,
            signal
          });
        });
      });
    }
  }

  // 添加API路由处理程序，提供WebSocket服务器信息
  nitroApp.hooks.hook('request', (event) => {
    event.context.io = io;
  });
});
