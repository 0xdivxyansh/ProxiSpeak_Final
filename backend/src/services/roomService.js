/**
 * Final Proxispeak - Room Business Logic Service
 */

import * as roomRepo from '../repositories/roomRepository.js';
import * as layoutService from './layoutService.js';
import * as sessionRepo from '../repositories/sessionRepository.js';

export async function getAllRoomsWithStats() {
  let rooms = await roomRepo.findAllRooms();
  if (rooms.length === 0 || !rooms.some((r) => r.roomId === 'main-hall')) {
    // Seed default office room
    await roomRepo.upsertRoom('main-hall', {
      roomId: 'main-hall',
      name: 'Global Innovation Hub',
      layoutId: 'default-office-layout',
      maxCapacity: 50
    });
    rooms = await roomRepo.findAllRooms();
  }

  const enrichedRooms = await Promise.all(
    rooms.map(async (r) => {
      const sessions = await sessionRepo.findSessionsByRoom(r.roomId);
      return {
        ...r,
        userCount: sessions.length
      };
    })
  );

  return enrichedRooms;
}

export async function getRoomDetails(roomId) {
  let room = await roomRepo.findRoomById(roomId);
  if (!room) {
    if (roomId === 'smart-home') {
      room = await roomRepo.upsertRoom('smart-home', {
        roomId: 'smart-home',
        name: 'Luxury 3D Smart House',
        layoutId: 'modern-house-layout',
        maxCapacity: 50
      });
    } else if (roomId === 'main-hall') {
      room = await roomRepo.upsertRoom('main-hall', {
        roomId: 'main-hall',
        name: 'Global Innovation Hub',
        layoutId: 'default-office-layout',
        maxCapacity: 50
      });
    }
  }

  if (!room) return null;

  const [layout, sessions] = await Promise.all([
    layoutService.getLayoutById(room.layoutId),
    sessionRepo.findSessionsByRoom(roomId)
  ]);

  return {
    ...room,
    userCount: sessions.length,
    users: sessions,
    layout
  };
}

export async function createNewRoom(data) {
  const existing = await roomRepo.findRoomById(data.roomId);
  if (existing) {
    const error = new Error('Room already exists');
    error.statusCode = 409;
    throw error;
  }

  // Ensure layout exists
  const layout = await layoutService.getLayoutById(data.layoutId || 'default-office-layout');
  if (!layout) {
    const error = new Error('Specified layout does not exist');
    error.statusCode = 400;
    throw error;
  }

  return roomRepo.createRoom({
    roomId: data.roomId,
    name: data.name,
    layoutId: layout.layoutId,
    maxCapacity: data.maxCapacity || 50
  });
}
