import { v4 as uuidv4 } from 'uuid';

export interface Room {
  id: string;
  name: string;
  hostId: string;
  viewers: string[];
  createdAt: Date;
}

const rooms = new Map<string, Room>();

export const createRoom = (hostId: string, name: string): Room => {
  const roomId = uuidv4();
  const room: Room = {
    id: roomId,
    name,
    hostId,
    viewers: [hostId],
    createdAt: new Date()
  };
  
  rooms.set(roomId, room);
  return room;
};

export const joinRoom = (roomId: string, userId: string): Room | null => {
  const room = rooms.get(roomId);
  if (!room) return null;
  
  if (!room.viewers.includes(userId)) {
    room.viewers.push(userId);
  }
  
  return room;
};

export const getRoomById = (roomId: string): Room | null => {
  return rooms.get(roomId) || null;
};

export const getRooms = (): Map<string, Room> => {
  return rooms;
};

export const leaveRoom = (roomId: string, userId: string): Room | null => {
  const room = rooms.get(roomId);
  if (!room) return null;
  
  room.viewers = room.viewers.filter(id => id !== userId);
  
  // 如果房主离开，则删除房间
  if (room.hostId === userId || room.viewers.length === 0) {
    rooms.delete(roomId);
    return null;
  }
  
  return room;
};
