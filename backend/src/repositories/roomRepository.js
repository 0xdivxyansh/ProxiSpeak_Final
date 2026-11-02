/**
 * Final Proxispeak - Room Data Access Repository
 */

import { Room } from '../models/Room.js';

export async function findAllRooms(query = {}) {
  return Room.find({ isActive: true, ...query }).lean();
}

export async function findRoomById(roomId) {
  return Room.findOne({ roomId, isActive: true }).lean();
}

export async function createRoom(roomData) {
  const room = new Room(roomData);
  return room.save();
}

export async function upsertRoom(roomId, roomData) {
  return Room.findOneAndUpdate(
    { roomId },
    { $set: roomData },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
}

export async function deleteRoom(roomId) {
  return Room.findOneAndUpdate({ roomId }, { $set: { isActive: false } }, { new: true });
}
