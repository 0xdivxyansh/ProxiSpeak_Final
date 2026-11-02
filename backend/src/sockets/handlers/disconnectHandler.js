/**
 * Final Proxispeak - Disconnect & Room Leave Socket Event Handler
 */

import { SOCKET_EVENTS } from '@proxispeak/shared';
import * as sessionRepo from '../../repositories/sessionRepository.js';

export function registerDisconnectHandler(io, socket, context) {
  const { roomManager, proximityEngine } = context;

  async function handleCleanup() {
    const removal = roomManager.removeUserBySocketId(socket.id);
    if (!removal || !removal.removedUser) return;

    const { removedUser, roomId } = removal;
    console.log(`[Socket] User ${removedUser.displayName} (${removedUser.userId}) left room ${roomId}`);

    // Leave socket room channel
    socket.leave(roomId);

    // 1. Proximity Engine Teardown
    const remainingUsers = roomManager.getRoomUsers(roomId);
    const teardownEvents = proximityEngine.handleUserDisconnect(removedUser.userId, remainingUsers);

    for (const evt of teardownEvents) {
      io.to(evt.targetUser.socketId).emit(SOCKET_EVENTS.PROXIMITY_UPDATE, {
        peerId: evt.disconnectedUserId,
        inRange: false
      });
    }

    // 2. Broadcast user:left to room
    socket.to(roomId).emit(SOCKET_EVENTS.USER_LEFT, {
      userId: removedUser.userId
    });

    // 3. Remove from MongoDB UserSession
    try {
      await sessionRepo.removeSessionBySocketId(socket.id);
    } catch (err) {
      console.error(`[DisconnectHandler] Error removing session from MongoDB: ${err.message}`);
    }
  }

  socket.on(SOCKET_EVENTS.ROOM_LEAVE, handleCleanup);
  socket.on(SOCKET_EVENTS.DISCONNECT, handleCleanup);
}
