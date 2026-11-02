/**
 * Final Proxispeak - Room Routes
 */

import { Router } from 'express';
import {
  getRooms,
  createRoom,
  getRoomById,
  getRoomUsers
} from '../controllers/roomController.js';
import { creationLimiter } from '../middleware/rateLimiter.js';

export const roomRoutes = Router();

roomRoutes.get('/rooms', getRooms);
roomRoutes.post('/rooms', creationLimiter, createRoom);
roomRoutes.get('/rooms/:roomId', getRoomById);
roomRoutes.get('/rooms/:roomId/users', getRoomUsers);

