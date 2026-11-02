/**
 * Final Proxispeak - Secure WebRTC Signaling Handler over Socket.IO
 */

import { SOCKET_EVENTS } from '@proxispeak/shared';

export function registerSignalingHandler(io, socket, context) {
  const { roomManager, proximityEngine } = context;

  /**
   * Helper to validate that sender and target are active peers in the same room and within range
   */
  function validatePeerRelationship(targetUserId) {
    const sender = roomManager.getUserBySocketId(socket.id);
    if (!sender) {
      return { isValid: false, error: 'UNAUTHORIZED_SENDER' };
    }

    const roomUsers = roomManager.getRoomUsers(sender.roomId);
    const targetUser = roomUsers.find((u) => u.userId === targetUserId);
    if (!targetUser) {
      return { isValid: false, error: 'TARGET_NOT_IN_ROOM' };
    }

    // Authorize proximity
    const isProximityActive = proximityEngine.isSignalingAuthorized(
      sender.userId,
      targetUserId
    );

    if (!isProximityActive) {
      return { isValid: false, error: 'PROXIMITY_NOT_ESTABLISHED' };
    }

    return { isValid: true, sender, targetUser };
  }

  // Handle WebRTC Offer
  socket.on(SOCKET_EVENTS.WEBRTC_OFFER, (payload) => {
    const { targetUserId, sdp } = payload || {};
    if (!targetUserId || !sdp || sdp.type !== 'offer') {
      return socket.emit(SOCKET_EVENTS.ERROR_MESSAGE, { error: 'INVALID_OFFER_PAYLOAD' });
    }

    // Size limit check (< 64KB)
    if (typeof sdp.sdp !== 'string' || sdp.sdp.length > 65536) {
      return socket.emit(SOCKET_EVENTS.ERROR_MESSAGE, { error: 'SDP_PAYLOAD_TOO_LARGE' });
    }

    const validation = validatePeerRelationship(targetUserId);
    if (!validation.isValid) {
      return socket.emit(SOCKET_EVENTS.ERROR_MESSAGE, { error: validation.error });
    }

    // Relay offer to target peer's socket with validated sender ID
    io.to(validation.targetUser.socketId).emit(SOCKET_EVENTS.WEBRTC_OFFER, {
      senderUserId: validation.sender.userId,
      sdp
    });
  });

  // Handle WebRTC Answer
  socket.on(SOCKET_EVENTS.WEBRTC_ANSWER, (payload) => {
    const { targetUserId, sdp } = payload || {};
    if (!targetUserId || !sdp || sdp.type !== 'answer') {
      return socket.emit(SOCKET_EVENTS.ERROR_MESSAGE, { error: 'INVALID_ANSWER_PAYLOAD' });
    }

    if (typeof sdp.sdp !== 'string' || sdp.sdp.length > 65536) {
      return socket.emit(SOCKET_EVENTS.ERROR_MESSAGE, { error: 'SDP_PAYLOAD_TOO_LARGE' });
    }

    const validation = validatePeerRelationship(targetUserId);
    if (!validation.isValid) {
      return socket.emit(SOCKET_EVENTS.ERROR_MESSAGE, { error: validation.error });
    }

    io.to(validation.targetUser.socketId).emit(SOCKET_EVENTS.WEBRTC_ANSWER, {
      senderUserId: validation.sender.userId,
      sdp
    });
  });

  // Handle ICE Candidate
  socket.on(SOCKET_EVENTS.WEBRTC_ICE, (payload) => {
    const { targetUserId, candidate } = payload || {};
    if (!targetUserId || !candidate) return;

    const validation = validatePeerRelationship(targetUserId);
    if (!validation.isValid) return;

    io.to(validation.targetUser.socketId).emit(SOCKET_EVENTS.WEBRTC_ICE, {
      senderUserId: validation.sender.userId,
      candidate
    });
  });
}
