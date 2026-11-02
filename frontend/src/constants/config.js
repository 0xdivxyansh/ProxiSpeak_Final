/**
 * Final Proxispeak - Frontend Client Constants & Configuration
 */

export const API_BASE = '/api';

export const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
];

export const WORKSPACE_CONFIG = {
  DEFAULT_WIDTH: 1600,
  DEFAULT_HEIGHT: 1000,
  PROXIMITY_RADIUS: 100, // Trigger WebRTC and audio attenuation <= 100px
  HYSTERESIS_BUFFER: 15,
  AVATAR_RADIUS: 18
};

