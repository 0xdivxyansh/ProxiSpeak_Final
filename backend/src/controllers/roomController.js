/**
 * Final Proxispeak - Room HTTP Controller
 */

import * as roomService from '../services/roomService.js';
import * as sessionRepo from '../repositories/sessionRepository.js';
import { createRoomSchema } from '../validation/schemas.js';

export async function getRooms(req, res, next) {
  try {
    const rooms = await roomService.getAllRoomsWithStats();
    res.json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    next(error);
  }
}

export async function createRoom(req, res, next) {
  try {
    const validatedData = createRoomSchema.parse(req.body);
    const newRoom = await roomService.createNewRoom(validatedData);
    res.status(201).json({
      success: true,
      data: newRoom
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          code: 'INVALID_INPUT',
          details: error.errors
        }
      });
    }
    next(error);
  }
}

export async function getRoomById(req, res, next) {
  try {
    const { roomId } = req.params;
    const room = await roomService.getRoomDetails(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        error: { message: `Room "${roomId}" not found`, code: 'ROOM_NOT_FOUND' }
      });
    }
    res.json({
      success: true,
      data: room
    });
  } catch (error) {
    next(error);
  }
}

export async function getRoomUsers(req, res, next) {
  try {
    const { roomId } = req.params;
    const users = await sessionRepo.findSessionsByRoom(roomId);
    res.json({
      success: true,
      roomId,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
}

