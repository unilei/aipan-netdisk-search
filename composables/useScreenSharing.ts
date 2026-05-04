import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { useSocketIo } from './useSocketIo';
import { useUserStore } from '~/stores/user';
import { Socket } from 'socket.io-client';

// 设置类型定义，确保类型安全
interface PeerConnectionsMap {
  [key: string]: RTCPeerConnection | null;
}

export const useScreenSharing = () => {
  const socketIo = useSocketIo();
  const userStore = useUserStore();
  const socketInstance = ref<Socket | null>(null);
  const isSocketConnected = ref(false);
  
  const isHost = ref(false);
  const currentRoom = reactive({
    id: '',
    name: '',
    hostId: '',
    viewers: [] as string[]
  });
  
  // 添加socket.id到userId的映射
  const socketIdMap = ref<Record<string, string>>({});
  
  const peerConnections = ref<PeerConnectionsMap>({});
  const screenStream = ref<MediaStream | null>(null);
  const isSharing = ref(false);
  const remoteStream = ref<MediaStream | null>(null);
  const errorMessage = ref("");
  
  // 初始化Socket连接 - 简化版本，直接使用socketManager
  const initSocketConnection = () => {
    try {
      if (socketInstance.value) {
        // 如果已经有连接，先检查是否连接状态
        if (socketInstance.value.connected) {
          console.log('Socket已连接，无需重新连接');
          isSocketConnected.value = true;
          return socketInstance.value;
        } else {
          console.log('Socket已存在但未连接，将重新建立连接');
          socketInstance.value.disconnect();
          socketInstance.value = null;
        }
      }
      
      // 强制初始化一个新的socket连接
      const socket = socketIo.initSocket();
      
      if (!socket) {
        console.error('Socket初始化失败，token可能无效');
        return null;
      }
      
      console.log('Socket成功初始化');
      socketInstance.value = socket;
      isSocketConnected.value = true;
      
      // 设置全局事件监听
      setupSignalListeners();
      
      // 设置用户加入/离开事件监听
      setupUserListeners();
      
      return socket;
    } catch (error) {
      console.error('初始化Socket连接失败:', error);
      isSocketConnected.value = false;
      return null;
    }
  };
  
  const createRoom = async (roomName: string) => {
    try {
      // 先检查用户是否已登录
      if (!userStore.isAuthenticated || !userStore.token) {
        console.error('用户未登录，无法创建房间');
        throw new Error('请先登录后再使用屏幕共享功能');
      }
      
      // 确保socket已初始化
      if (!socketInstance.value) {
        const result = initSocketConnection();
        if (!result) {
          throw new Error('无法连接到服务器，请确保您已登录');
        }
      }
      
      // 获取当前socket实例（如果initSocketConnection失败也会返回null）
      const socket = socketIo.getSocket();
      
      if (!socket) {
        throw new Error('无法连接到服务器，请确保您已登录');
      }
      
      return new Promise((resolve, reject) => {
        console.log('正在创建屏幕共享房间:', roomName);
        
        // 移除之前的监听器
        socket.off('room_created');
        
        // 监听房间创建成功事件
        socket.once('room_created', (roomData: any) => {
          console.log('房间创建成功:', roomData);
          
          // 更新当前房间信息
          Object.assign(currentRoom, roomData);
          
          // 设置为主持人
          isHost.value = true;
          
          // 加入房间
          socket.emit('join_room', roomData.id);
          
          // 设置信号处理
          setupSignalListeners();
          
          resolve(roomData);
        });
        
        // 监听错误
        socket.once('error', (error: any) => {
          console.error('创建房间失败:', error);
          reject(new Error(error.message || '创建房间失败'));
        });
        
        // 发送创建房间请求
        socket.emit('create_room', { roomName });
      });
    } catch (err: any) {
      console.error('创建房间失败', err);
      errorMessage.value = err.message || '创建房间失败';
      throw err;
    }
  };
  
  const joinRoom = async (roomId: string) => {
    try {
      await initSocketConnection();
      
      if (!isSocketConnected.value) {
        throw new Error('Socket未连接，无法加入房间');
      }
      
      // 获取当前socket实例
      const socket = socketIo.getSocket();
      
      if (!socket) {
        throw new Error('无法连接到服务器，请确保您已登录');
      }
      
      return new Promise((resolve, reject) => {
        console.log('正在加入屏幕共享房间:', roomId);
        
        // 移除之前的监听器
        socket.off('room_joined');
        socket.off('error');
        
        // 监听加入房间成功事件
        socket.once('room_joined', (roomData: { id: string, name: string, hostId: string, viewers: string[] }) => {
          console.log('加入房间成功:', roomData);
          
          // 设置主持人状态
          isHost.value = roomData.hostId === String(userStore.user?.id);
          
          // 更新当前房间信息
          Object.assign(currentRoom, {
            id: roomData.id,
            name: roomData.name,
            hostId: roomData.hostId,
            viewers: roomData.viewers || []
          });
          
          // 设置信号处理
          setupSignalListeners();
          
          resolve(roomData);
        });
        
        // 监听错误
        socket.once('error', (error: any) => {
          console.error('加入房间失败:', error);
          reject(new Error(error.message || '加入房间失败'));
        });
        
        // 发送加入房间请求
        socket.emit('join_room', roomId);
      });
    } catch (error) {
      console.error('加入房间异常:', error);
      errorMessage.value = error instanceof Error ? error.message : '加入房间失败';
      throw error;
    }
  };
  
  const leaveRoom = () => {
    if (currentRoom.id && socketInstance.value) {
      socketInstance.value.emit('leave-screen-room', currentRoom.id);
      
      if (isSharing.value) {
        stopScreenShare();
      }
      
      cleanupRoom();
    }
  };
  
  const startScreenShare = async () => {
    try {
      // 检查是否为房主
      if (!isHost.value) {
        throw new Error('只有房主才能共享屏幕');
      }
      
      // 如果已经在共享屏幕
      if (isSharing.value && screenStream.value) {
        return screenStream.value;
      }
      
      // 使用标准WebRTC API获取屏幕媒体流
      console.log('请求屏幕共享权限...');
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      
      console.log('屏幕共享权限获取成功，开始设置流');
      screenStream.value = stream;
      isSharing.value = true;
      
      // 监听流的结束事件（用户停止共享）
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          console.log('用户停止了屏幕共享');
          stopScreenShare();
        };
      }
      
      // 为当前房间中的所有观众创建对等连接
      console.log('currentRoom.viewers:', currentRoom.viewers);
      currentRoom.viewers.forEach(viewerId => {
        // 跳过自己
        if (viewerId === currentRoom.hostId) return;
        
        console.log(`为观众 ${viewerId} 创建对等连接`);
        createPeerConnection(viewerId, true);
      });
      
      // 通知服务器开始共享
      const socket = socketIo.getSocket();
      if (socket) {
        socket.emit('screen_sharing_started', currentRoom.id);
      }
      
      console.log('屏幕共享启动完成');
      return stream;
    } catch (error) {
      console.error('屏幕共享失败:', error);
      
      // 如果是用户取消了共享请求，不显示错误
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        console.log('用户取消了屏幕共享请求');
        errorMessage.value = "";
      } else {
        errorMessage.value = error instanceof Error ? error.message : '屏幕共享失败';
      }
      
      isSharing.value = false;
      return null;
    }
  };
  
  const stopScreenShare = () => {
    if (!isHost.value) return;
    
    // 停止所有媒体轨道
    if (screenStream.value) {
      screenStream.value.getTracks().forEach(track => track.stop());
      screenStream.value = null;
    }
    
    // 关闭所有对等连接
    Object.keys(peerConnections.value).forEach(viewerId => {
      peerConnections.value[viewerId]?.close();
      delete peerConnections.value[viewerId];
    });
    
    isSharing.value = false;
  };
  
  const cleanupRoom = () => {
    if (isHost.value) {
      stopScreenShare();
    }
    
    // 关闭所有对等连接
    Object.keys(peerConnections.value).forEach(viewerId => {
      peerConnections.value[viewerId]?.close();
      delete peerConnections.value[viewerId];
    });
    
    Object.assign(currentRoom, {
      id: "",
      name: "",
      hostId: "",
      viewers: []
    });
  };
  
  const createPeerConnection = (viewerId: string, initiator = false) => {
    // 如果已存在连接，先清理
    if (peerConnections.value[viewerId]) {
      peerConnections.value[viewerId]?.close();
      delete peerConnections.value[viewerId];
    }

    const socket = socketIo.getSocket();
    if (!socket) {
      console.error('Socket连接不可用，无法创建对等连接');
      return null;
    }

    console.log(`创建与用户 ${viewerId} 的对等连接, initiator:`, initiator);

    try {
      // 创建新的对等连接
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      });

      // 保存对等连接
      peerConnections.value[viewerId] = pc;

      // 处理ICE候选者
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('发送ICE候选者到对方');
          
          // 使用socketId发送信令（如果存在映射）
          const targetSocketId = socketIdMap.value[viewerId] || viewerId;
          
          socket.emit('signal', {
            to: targetSocketId,
            signal: {
              type: 'candidate',
              candidate: event.candidate
            }
          });
        }
      };

      // 处理连接状态变化
      pc.onconnectionstatechange = () => {
        console.log(`连接状态变化 (${viewerId}):`, pc.connectionState);
      };

      // 处理ICE连接状态变化
      pc.oniceconnectionstatechange = () => {
        console.log(`ICE连接状态变化 (${viewerId}):`, pc.iceConnectionState);
      };

      // 当收到远程媒体流时
      pc.ontrack = (event) => {
        console.log('接收到对方的媒体轨道');
        
        if (!remoteStream.value) {
          remoteStream.value = new MediaStream();
        }
        
        // 添加新轨道到远程流
        const stream = event.streams[0];
        if (stream) {
          stream.getTracks().forEach(track => {
            console.log('添加远程轨道到远程流:', track.kind);
            remoteStream.value?.addTrack(track);
          });
        }
      };

      // 如果是房主且有屏幕流，添加轨道
      if (isHost.value && screenStream.value && initiator) {
        console.log('主持人正在添加媒体轨道到对等连接');
        screenStream.value.getTracks().forEach(track => {
          if (screenStream.value) {
            console.log('添加轨道:', track.kind);
            pc.addTrack(track, screenStream.value);
          }
        });
        
        // 创建并发送offer
        pc.createOffer()
          .then(offer => pc.setLocalDescription(offer))
          .then(() => {
            console.log('发送offer到观众');
            
            // 使用socketId发送信令（如果存在映射）
            const targetSocketId = socketIdMap.value[viewerId] || viewerId;
            
            socket.emit('signal', {
              to: targetSocketId,
              signal: {
                type: 'offer',
                sdp: pc.localDescription
              }
            });
          })
          .catch(err => {
            console.error('创建offer失败:', err);
            errorMessage.value = '创建连接失败';
          });
      }

      return pc;
    } catch (err) {
      console.error('创建对等连接失败:', err);
      errorMessage.value = '创建连接失败';
      return null;
    }
  };

  const handleSignaling = () => {
    const socket = socketIo.getSocket();
    if (!socket) return;

    // 移除之前的监听器，防止重复
    socket.off('signal');
    
    // 添加新的信令处理
    socket.on('signal', async (data: { from: string; signal: any }) => {
      const { from, signal } = data;
      console.log('收到信令:', { from, signalType: signal.type });
      
      try {
        // 查找发送者的userId（如果找不到，就使用socketId作为key）
        let senderKey = from;
        for (const [userId, socketId] of Object.entries(socketIdMap.value)) {
          if (socketId === from) {
            senderKey = userId;
            break;
          }
        }
        
        // 确保有对应的对等连接
        let peer = peerConnections.value[senderKey];
        if (!peer) {
          console.log(`为发送者 ${senderKey} 创建新的对等连接`);
          peer = createPeerConnection(senderKey);
        }
        
        if (!peer) {
          throw new Error('无法创建对等连接');
        }

        // 处理不同类型的信令
        if (signal.type === 'offer') {
          console.log('处理offer信令');
          await peer.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          
          socket.emit('signal', {
            to: from, // 使用原始的socketId发送回信令
            signal: {
              type: 'answer',
              sdp: peer.localDescription
            }
          });
        } 
        else if (signal.type === 'answer') {
          console.log('处理answer信令');
          await peer.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        } 
        else if (signal.type === 'candidate') {
          console.log('处理ice candidate信令');
          await peer.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      } catch (err) {
        console.error('处理信令错误:', err);
        errorMessage.value = '处理连接信号失败';
      }
    });
  };

  const setupSignalListeners = () => {
    const socket = socketIo.getSocket();
    if (!socket) return;
    
    // 处理信令消息
    handleSignaling();
    
    // 处理房间用户信息更新
    socket.off('room_users');
    socket.on('room_users', (users: { userId: string, socketId: string }[]) => {
      console.log('收到房间用户列表更新:', users);
      
      // 更新socketId映射表
      users.forEach(user => {
        socketIdMap.value[user.userId] = user.socketId;
      });
      
      console.log('已更新房间用户socketId映射:', socketIdMap.value);
    });
  };
  
  const setupUserListeners = () => {
    const socket = socketIo.getSocket();
    if (!socket) return;
    
    // 修正事件名称为user_joined和user_left，与服务器端一致
    socket.on('user_joined', (data: { userId: string, username: string }) => {
      console.log(`用户 ${data.username}(${data.userId}) 加入了房间`);
      
      // 更新房间观众列表
      if (!currentRoom.viewers.includes(data.userId)) {
        currentRoom.viewers.push(data.userId);
      }
      
      // 如果是主持人且正在共享屏幕，创建对等连接
      if (isHost.value && isSharing.value) {
        console.log('开始为新加入的观众创建对等连接');
        createPeerConnection(data.userId, true);
      }
    });
    
    socket.on('user_left', (data: { userId: string, username: string }) => {
      console.log(`用户 ${data.username}(${data.userId}) 离开了房间`);
      
      // 更新房间观众列表
      const index = currentRoom.viewers.indexOf(data.userId);
      if (index !== -1) {
        currentRoom.viewers.splice(index, 1);
      }
      
      // 关闭对等连接
      if (peerConnections.value[data.userId]) {
        peerConnections.value[data.userId]?.close();
        delete peerConnections.value[data.userId];
      }
    });
  };
  
  // 组件挂载时初始化socket
  onMounted(() => {
    // 确保Socket初始化并设置事件监听器
    initSocketConnection();
  });
  
  // 组件卸载时清理
  onUnmounted(() => {
    leaveRoom();
    // 清除所有监听器，但不断开连接，保留给其他组件使用
    if (socketInstance.value) {
      socketInstance.value.off('signal');
    }
  });
  
  return {
    createRoom,
    joinRoom,
    leaveRoom,
    startScreenShare,
    stopScreenShare,
    currentRoom,
    isHost,
    isSharing,
    remoteStream,
    screenStream,
    errorMessage,
    isSocketConnected
  };
};
