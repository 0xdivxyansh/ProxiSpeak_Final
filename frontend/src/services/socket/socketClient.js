/**
 * Final Proxispeak - Socket.IO Real-Time Client Service
 */

import { io } from 'socket.io-client';
import { SOCKET_EVENTS } from '@proxispeak/shared';

class SocketClient {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(url = window.location.origin) {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    this.socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    this.socket.on('connect', () => {
      console.log(`[Socket] Connected with ID: ${this.socket.id}`);
      this.emitInternal('connect', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.warn(`[Socket] Disconnected: ${reason}`);
      this.emitInternal('disconnect', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error(`[Socket] Connection error: ${error.message}`);
      this.emitInternal('error', error);
    });

    // Wire up shared socket events
    this.socket.on(SOCKET_EVENTS.ROOM_STATE, (data) => this.emitInternal('room:state', data));
    this.socket.on(SOCKET_EVENTS.USER_JOINED, (data) => this.emitInternal('user:joined', data));
    this.socket.on(SOCKET_EVENTS.USER_LEFT, (data) => this.emitInternal('user:left', data));
    this.socket.on(SOCKET_EVENTS.USER_MOVED, (data) => this.emitInternal('user:moved', data));
    this.socket.on(SOCKET_EVENTS.POSITION_CORRECTION, (data) => this.emitInternal('user:position_correction', data));
    this.socket.on(SOCKET_EVENTS.PROXIMITY_UPDATE, (data) => this.emitInternal('proximity:update', data));
    this.socket.on(SOCKET_EVENTS.USER_MUTED, (data) => this.emitInternal('user:muted', data));
    this.socket.on(SOCKET_EVENTS.ERROR_MESSAGE, (data) => this.emitInternal('error:message', data));

    // WebRTC Signaling events
    this.socket.on(SOCKET_EVENTS.WEBRTC_OFFER, (data) => this.emitInternal('webrtc:offer', data));
    this.socket.on(SOCKET_EVENTS.WEBRTC_ANSWER, (data) => this.emitInternal('webrtc:answer', data));
    this.socket.on(SOCKET_EVENTS.WEBRTC_ICE, (data) => this.emitInternal('webrtc:ice', data));

    return this.socket;
  }

  isConnected() {
    return Boolean(this.socket && this.socket.connected);
  }

  joinRoom(roomId, displayName, preferredColor, initialPosition) {
    if (!this.socket) return;
    this.socket.emit(
      SOCKET_EVENTS.ROOM_JOIN,
      {
        roomId,
        displayName,
        preferredColor,
        initialPosition
      },
      (response) => {
        if (response && !response.success) {
          console.error('[Socket] Join rejected:', response.error);
        }
      }
    );
  }

  leaveRoom() {
    if (!this.socket) return;
    this.socket.emit(SOCKET_EVENTS.ROOM_LEAVE);
  }

  sendMove(x, y, facing = 'down') {
    if (!this.socket) return;
    this.socket.emit(SOCKET_EVENTS.USER_MOVE, {
      x,
      y,
      facing,
      timestamp: Date.now()
    });
  }

  sendMute(isMuted) {
    if (!this.socket) return;
    this.socket.emit(SOCKET_EVENTS.USER_MUTE, { isMuted });
  }

  sendOffer(targetUserId, sdp) {
    if (!this.socket) return;
    this.socket.emit(SOCKET_EVENTS.WEBRTC_OFFER, { targetUserId, sdp });
  }

  sendAnswer(targetUserId, sdp) {
    if (!this.socket) return;
    this.socket.emit(SOCKET_EVENTS.WEBRTC_ANSWER, { targetUserId, sdp });
  }

  sendIceCandidate(targetUserId, candidate) {
    if (!this.socket) return;
    this.socket.emit(SOCKET_EVENTS.WEBRTC_ICE, { targetUserId, candidate });
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emitInternal(event, data) {
    if (this.listeners.has(event)) {
      for (const callback of this.listeners.get(event)) {
        try {
          callback(data);
        } catch (e) {
          console.error(`[SocketClient] Error in listener for ${event}:`, e);
        }
      }
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }
}

export const socketClient = new SocketClient();

