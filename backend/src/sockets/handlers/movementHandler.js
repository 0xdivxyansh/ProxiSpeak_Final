/**
 * Final Proxispeak - Movement Socket Event Handler
 */

import { SOCKET_EVENTS } from '@proxispeak/shared';
import { validateMovement } from '../../geospatial/movementValidator.js';
import * as sessionRepo from '../../repositories/sessionRepository.js';

export function registerMovementHandler(io, socket, context) {
  const { roomManager, proximityEngine, layoutService } = context;

  socket.on(SOCKET_EVENTS.USER_MOVE, async (payload) => {
    try {
      const user = roomManager.getUserBySocketId(socket.id);
      if (!user) return;

      const { roomId } = user;
      // Fetch room layout to obtain furniture obstacles
      const layout = await layoutService.getLayoutById('default-office-layout');
      const furniture = layout ? layout.furniture : [];

      // 1. Authoritative Server Validation
      const validation = validateMovement(user, payload, furniture);
      if (!validation.isValid) {
        socket.emit(SOCKET_EVENTS.POSITION_CORRECTION, {
          x: validation.correctedPosition.x,
          y: validation.correctedPosition.y,
          reason: validation.reason
        });
        return;
      }

      // 2. Update In-Memory Position
      const updatedUser = roomManager.updateUserPosition(
        socket.id,
        payload.x,
        payload.y,
        payload.facing
      );

      // 3. Asynchronously Update MongoDB UserSession
      sessionRepo
        .upsertSession({
          userId: user.userId,
          socketId: socket.id,
          roomId,
          displayName: user.displayName,
          color: user.color,
          x: payload.x,
          y: payload.y,
          facing: payload.facing,
          isMuted: user.isMuted
        })
        .catch((err) => {
          console.error(`[MovementHandler] MongoDB session sync error: ${err.message}`);
        });

      // 4. Broadcast Movement to Room Peers (Scoped strictly to this roomId)
      socket.to(roomId).emit(SOCKET_EVENTS.USER_MOVED, {
        userId: user.userId,
        x: payload.x,
        y: payload.y,
        facing: payload.facing
      });

      // 5. Evaluate Proximity Transitions
      const roomUsers = roomManager.getRoomUsers(roomId);
      const transitions = proximityEngine.evaluateUserMovement(updatedUser, roomUsers);

      for (const t of transitions) {
        if (t.type === 'ENTER') {
          // Emit to moving user
          io.to(t.userA.socketId).emit(SOCKET_EVENTS.PROXIMITY_UPDATE, {
            peerId: t.userB.userId,
            inRange: true,
            distance: t.distance,
            isPolite: t.isPoliteForA
          });
          // Emit to peer
          io.to(t.userB.socketId).emit(SOCKET_EVENTS.PROXIMITY_UPDATE, {
            peerId: t.userA.userId,
            inRange: true,
            distance: t.distance,
            isPolite: t.isPoliteForB
          });
        } else if (t.type === 'EXIT') {
          io.to(t.userA.socketId).emit(SOCKET_EVENTS.PROXIMITY_UPDATE, {
            peerId: t.userB.userId,
            inRange: false,
            distance: t.distance
          });
          io.to(t.userB.socketId).emit(SOCKET_EVENTS.PROXIMITY_UPDATE, {
            peerId: t.userA.userId,
            inRange: false,
            distance: t.distance
          });
        } else if (t.type === 'DISTANCE_UPDATE') {
          // Client spatial audio engine updates gain and panning dynamically
          io.to(t.userA.socketId).emit(SOCKET_EVENTS.PROXIMITY_UPDATE, {
            peerId: t.userB.userId,
            inRange: true,
            distance: t.distance
          });
          io.to(t.userB.socketId).emit(SOCKET_EVENTS.PROXIMITY_UPDATE, {
            peerId: t.userA.userId,
            inRange: true,
            distance: t.distance
          });
        }
      }
    } catch (error) {
      console.error(`[MovementHandler] Error processing move event: ${error.message}`);
    }
  });

  socket.on(SOCKET_EVENTS.USER_MUTE, (payload) => {
    const user = roomManager.getUserBySocketId(socket.id);
    if (!user) return;

    const isMuted = Boolean(payload.isMuted);
    roomManager.updateUserMute(socket.id, isMuted);

    // Update MongoDB
    sessionRepo.upsertSession({ ...user, isMuted }).catch(() => {});

    // Broadcast mute state to room
    io.to(user.roomId).emit(SOCKET_EVENTS.USER_MUTED, {
      userId: user.userId,
      isMuted
    });
  });
}
