/**
 * Final Proxispeak - Shared System Defaults and Constants
 */

export const WORKSPACE_DEFAULTS = {
  WIDTH: 1600,
  HEIGHT: 1000,
  BACKGROUND_COLOR: '#0f172a',
  GRID_SIZE: 40,
  GRID_COLOR: '#1e293b'
};

export const AVATAR_DEFAULTS = {
  RADIUS: 18,
  DEFAULT_COLOR: '#38bdf8',
  COLORS: [
    '#38bdf8', // Sky blue
    '#34d399', // Emerald
    '#f472b6', // Pink
    '#fbbf24', // Amber
    '#a78bfa', // Purple
    '#f87171', // Red
    '#2dd4bf', // Teal
    '#fb923c'  // Orange
  ],
  SPEED_PPS: 220, // Normal movement speed in pixels per second
  MAX_ALLOWED_PPS: 350 // Anti-cheat max velocity limit
};

export const PROXIMITY_DEFAULTS = {
  ACTIVATION_RADIUS: 100, // Pixels: WebRTC audio triggers at or below 100px
  HYSTERESIS_BUFFER: 15,  // Pixels: Disconnect triggers at > 115px to prevent flutter
  MAX_DISTANCE: 100,       // Max distance for audio attenuation calculations
  OCCLUSION_FACTOR: 0.25   // Direct line of sight obstruction multiplier (75% attenuation)
};

export const AUDIO_DEFAULTS = {
  ROLLOFF_FACTOR: 1.5,
  MIN_GAIN: 0.0,
  MAX_GAIN: 1.0,
  PAN_LIMIT: 0.95 // Maximum stereo pan left (-0.95) / right (+0.95)
};
