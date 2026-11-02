/**
 * Final Proxispeak - Room Join Socket Event Handler
 */

import { SOCKET_EVENTS, AVATAR_DEFAULTS } from '@proxispeak/shared';
import * as sessionRepo from '../../repositories/sessionRepository.js';
import { checkAvatarCollision } from '../../geospatial/collisionEngine.js';
import { joinRoomSchema } from '../../validation/schemas.js';

export function registerJoinHandler(io, socket, context) {
  const { roomManager, proximityEngine, layoutService, roomService } = context;

  socket.on(SOCKET_EVENTS.ROOM_JOIN, async (payload, callback) => {
    try {
      // 1. Validate join payload
      const validated = joinRoomSchema.parse(payload);
      const { roomId, displayName, preferredColor, initialPosition } = validated;

      // Unique user ID for session (or socket ID if not supplied)
      const userId = payload.userId || `user_${socket.id.substring(0, 8)}`;

      // 2. Fetch room and layout details
      let room = await roomService.getRoomDetails(roomId);
      if (!room) {
        // Automatically ensure default room if requested
        if (roomId === 'main-hall') {
          room = await roomService.getRoomDetails('main-hall');
        } else {
          const errorMsg = `Room "${roomId}" does not exist`;
          socket.emit(SOCKET_EVENTS.ERROR_MESSAGE, { error: errorMsg, code: 'ROOM_NOT_FOUND' });
          if (typeof callback === 'function') callback({ success: false, error: errorMsg });
          return;
        }
      }

      const layout = room.layout || (await layoutService.getLayoutById('default-office-layout'));
      const furniture = layout ? layout.furniture : [];

      // 3. Determine safe initial spawn position
      let spawnX = initialPosition?.x ?? (layout?.spawnPoint?.x || 800);
      let spawnY = initialPosition?.y ?? (layout?.spawnPoint?.y || 880);

      // Apply slight random jitter to prevent perfect stacking at spawn
      const jitterOffset = (Math.random() - 0.5) * 40;
      spawnX = Math.round(Math.max(50, Math.min(layout?.dimensions?.width - 50 || 1550, spawnX + jitterOffset)));

      // If initial spawn collides with furniture, fallback to safe coordinates
      const collision = checkAvatarCollision(spawnX, spawnY, furniture);
      if (collision.collides) {
        spawnX = layout?.spawnPoint?.x || 800;
        spawnY = layout?.spawnPoint?.y || 880;
      }

      // 4. Assign avatar color
      const roomUsers = roomManager.getRoomUsers(roomId);
      const colorIndex = roomUsers.length % AVATAR_DEFAULTS.COLORS.length;
      const color = preferredColor || AVATAR_DEFAULTS.COLORS[colorIndex];

      const userSession = {
        userId,
        socketId: socket.id,
        roomId,
        displayName,
        color,
        x: spawnX,
        y: spawnY,
        facing: 'down',
        isMuted: false,
        lastActiveTimestamp: Date.now()
      };

      // 5. Add to In-Memory Room Manager
      roomManager.addUser(roomId, userSession);

      // 6. Asynchronously upsert MongoDB UserSession record
      sessionRepo
        .upsertSession({
          userId,
          socketId: socket.id,
          roomId,
          displayName,
          color,
          x: spawnX,
          y: spawnY,
          facing: 'down',
          isMuted: false
        })
        .catch((err) => {
          console.error(`[JoinHandler] Error saving session to MongoDB: ${err.message}`);
        });

      // 7. Join Socket.IO Room Channel
      socket.join(roomId);

      // 8. Prepare full room state for the joining user
      const currentUsersInRoom = roomManager.getRoomUsers(roomId);
      const roomStatePayload = {
        self: userSession,
        room: {
          roomId: room.roomId,
          name: room.name,
          layoutId: room.layoutId
        },
        layout: {
          dimensions: layout?.dimensions || { width: 1600, height: 1000 },
          furniture: layout?.furniture || []
        },
        users: currentUsersInRoom.filter((u) => u.userId !== userId)
      };

      // Send initial room state to joining client
      socket.emit(SOCKET_EVENTS.ROOM_STATE, roomStatePayload);

      // 9. Notify other peers in this room
      socket.to(roomId).emit(SOCKET_EVENTS.USER_JOINED, userSession);

      // 10. Check immediate proximity transitions with existing users
      const proximityTransitions = proximityEngine.evaluateUserMovement(
        userSession,
        currentUsersInRoom
      );

      for (const t of proximityTransitions) {
        if (t.type === 'ENTER') {
          io.to(t.userA.socketId).emit(SOCKET_EVENTS.PROXIMITY_UPDATE, {
            peerId: t.userB.userId,
            inRange: true,
            distance: t.distance,
            isPolite: t.isPoliteForA
          });
          io.to(t.userB.socketId).emit(SOCKET_EVENTS.PROXIMITY_UPDATE, {
            peerId: t.userA.userId,
            inRange: true,
            distance: t.distance,
            isPolite: t.isPoliteForB
          });
        }
      }

      console.log(`[Socket] User "${displayName}" (${userId}) joined room "${roomId}" at (${spawnX}, ${spawnY})`);

      if (typeof callback === 'function') {
        callback({ success: true, user: userSession });
      }
    } catch (error) {
      console.error(`[JoinHandler] Failed to join room: ${error.message}`);
      socket.emit(SOCKET_EVENTS.ERROR_MESSAGE, {
        error: error.message,
        code: 'JOIN_ERROR'
      });
      if (typeof callback === 'function') {
        callback({ success: false, error: error.message });
      }
    }
  });
}

