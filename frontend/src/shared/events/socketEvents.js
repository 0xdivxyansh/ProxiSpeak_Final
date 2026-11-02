/**
 * Final Proxispeak - Socket.IO Central Event Names
 */

export const SOCKET_EVENTS = {
  // Client -> Server
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  USER_MOVE: 'user:move',
  USER_MUTE: 'user:mute',
  WEBRTC_OFFER: 'webrtc:offer',
  WEBRTC_ANSWER: 'webrtc:answer',
  WEBRTC_ICE: 'webrtc:ice',

  // Server -> Client
  ROOM_STATE: 'room:state',
  USER_JOINED: 'user:joined',
  USER_LEFT: 'user:left',
  USER_MOVED: 'user:moved',
  POSITION_CORRECTION: 'user:position_correction',
  PROXIMITY_UPDATE: 'proximity:update',
  USER_MUTED: 'user:muted',
  ERROR_MESSAGE: 'error:message',

  // System
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  RECONNECT: 'reconnect'
};
