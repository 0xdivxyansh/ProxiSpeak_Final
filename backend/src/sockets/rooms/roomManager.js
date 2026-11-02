/**
 * Final Proxispeak - In-Memory Room & Session Manager
 */

export class RoomManager {
  constructor() {
    // Map<roomId, Map<userId, userSessionObject>>
    this.rooms = new Map();
    // Map<socketId, { userId, roomId }>
    this.socketIndex = new Map();
  }

  addUser(roomId, userSession) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Map());
    }

    const room = this.rooms.get(roomId);
    room.set(userSession.userId, userSession);
    this.socketIndex.set(userSession.socketId, {
      userId: userSession.userId,
      roomId
    });
  }

  removeUserBySocketId(socketId) {
    const meta = this.socketIndex.get(socketId);
    if (!meta) return null;

    const { userId, roomId } = meta;
    this.socketIndex.delete(socketId);

    const room = this.rooms.get(roomId);
    let removedUser = null;
    if (room) {
      removedUser = room.get(userId);
      room.delete(userId);
      if (room.size === 0) {
        this.rooms.delete(roomId);
      }
    }

    return { removedUser, roomId };
  }

  getUserBySocketId(socketId) {
    const meta = this.socketIndex.get(socketId);
    if (!meta) return null;
    const room = this.rooms.get(meta.roomId);
    return room ? room.get(meta.userId) : null;
  }

  getRoomUsers(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    return Array.from(room.values());
  }

  updateUserPosition(socketId, x, y, facing) {
    const user = this.getUserBySocketId(socketId);
    if (!user) return null;

    user.x = x;
    user.y = y;
    if (facing) user.facing = facing;
    user.lastActiveTimestamp = Date.now();
    return user;
  }

  updateUserMute(socketId, isMuted) {
    const user = this.getUserBySocketId(socketId);
    if (!user) return null;
    user.isMuted = isMuted;
    return user;
  }

  getRoomCount() {
    return this.rooms.size;
  }

  clear() {
    this.rooms.clear();
    this.socketIndex.clear();
  }
}

export const defaultRoomManager = new RoomManager();
