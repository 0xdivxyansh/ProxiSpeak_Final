/**
 * Final Proxispeak - Socket.IO Server Initialization & Dispatcher
 */

import { Server } from 'socket.io';
import { config } from '../config/index.js';
import { defaultRoomManager } from './rooms/roomManager.js';
import { defaultProximityEngine } from '../proximity/proximityEngine.js';
import * as layoutService from '../services/layoutService.js';
import * as roomService from '../services/roomService.js';
import { registerJoinHandler } from './handlers/joinHandler.js';
import { registerMovementHandler } from './handlers/movementHandler.js';
import { registerSignalingHandler } from './signaling/signalingHandler.js';
import { registerDisconnectHandler } from './handlers/disconnectHandler.js';

export function initializeSockets(httpServer, customContext = {}) {
  const io = new Server(httpServer, {
    cors: {
      origin: [
        config.frontendUrl,
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
        'http://127.0.0.1:3000'
      ],
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 20000,
    pingInterval: 10000,
    maxHttpBufferSize: 1e6 // 1MB payload ceiling
  });

  const context = {
    roomManager: customContext.roomManager || defaultRoomManager,
    proximityEngine: customContext.proximityEngine || defaultProximityEngine,
    layoutService: customContext.layoutService || layoutService,
    roomService: customContext.roomService || roomService
  };

  io.on('connection', (socket) => {
    // Register domain handlers
    registerJoinHandler(io, socket, context);
    registerMovementHandler(io, socket, context);
    registerSignalingHandler(io, socket, context);
    registerDisconnectHandler(io, socket, context);
  });

  return { io, context };
}

