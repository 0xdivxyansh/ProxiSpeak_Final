import { describe, it, expect, beforeEach } from 'vitest';
import { RoomManager } from '../../sockets/rooms/roomManager.js';

describe('Room Manager', () => {
  let roomManager;

  beforeEach(() => {
    roomManager = new RoomManager();
  });

  it('adds and retrieves users by roomId and socketId', () => {
    const user = {
      userId: 'user_1',
      socketId: 'sock_1',
      roomId: 'room_alpha',
      displayName: 'Alice',
      color: '#38bdf8',
      x: 100,
      y: 100,
      isMuted: false
    };

    roomManager.addUser('room_alpha', user);

    expect(roomManager.getUserBySocketId('sock_1')).toEqual(user);
    expect(roomManager.getRoomUsers('room_alpha')).toEqual([user]);
    expect(roomManager.getRoomUsers('room_beta')).toEqual([]);
  });

  it('updates position and mute state', () => {
    const user = {
      userId: 'user_1',
      socketId: 'sock_1',
      roomId: 'room_alpha',
      displayName: 'Alice',
      x: 100,
      y: 100,
      isMuted: false
    };

    roomManager.addUser('room_alpha', user);
    roomManager.updateUserPosition('sock_1', 150, 200, 'right');
    roomManager.updateUserMute('sock_1', true);

    const updated = roomManager.getUserBySocketId('sock_1');
    expect(updated.x).toBe(150);
    expect(updated.y).toBe(200);
    expect(updated.facing).toBe('right');
    expect(updated.isMuted).toBe(true);
  });

  it('removes user cleanly and deletes empty rooms', () => {
    const user = {
      userId: 'user_1',
      socketId: 'sock_1',
      roomId: 'room_alpha',
      displayName: 'Alice'
    };

    roomManager.addUser('room_alpha', user);
    expect(roomManager.getRoomCount()).toBe(1);

    const removal = roomManager.removeUserBySocketId('sock_1');
    expect(removal.removedUser.userId).toBe('user_1');
    expect(removal.roomId).toBe('room_alpha');
    expect(roomManager.getRoomUsers('room_alpha')).toEqual([]);
    expect(roomManager.getRoomCount()).toBe(0);
  });
});

