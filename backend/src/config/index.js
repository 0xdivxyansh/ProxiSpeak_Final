/**
 * Final Proxispeak - Centralized Configuration Module
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load .env from root project directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

function parseNumber(val, defaultVal) {
  const parsed = Number(val);
  return Number.isFinite(parsed) ? parsed : defaultVal;
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: parseNumber(process.env.PORT, 5000),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Database
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/final_proxispeak'
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
    required: process.env.REDIS_REQUIRED === 'true'
  },

  // Workspace & Geospatial Proximity
  workspace: {
    width: parseNumber(process.env.WORKSPACE_WIDTH, 1600),
    height: parseNumber(process.env.WORKSPACE_HEIGHT, 1000),
    proximityRadius: parseNumber(process.env.PROXIMITY_RADIUS, 100),
    hysteresisBuffer: parseNumber(process.env.PROXIMITY_HYSTERESIS, 15),
    maxMovementSpeedPps: parseNumber(process.env.MAX_MOVEMENT_SPEED_PPS, 350)
  },

  // WebRTC ICE Servers
  webrtc: {
    stunUrls: (process.env.STUN_URLS || 'stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302')
      .split(',')
      .map((url) => url.trim())
      .filter(Boolean),
    turnUrl: process.env.TURN_URL || '',
    turnUsername: process.env.TURN_USERNAME || '',
    turnCredential: process.env.TURN_CREDENTIAL || ''
  }
};

/**
 * Validates critical environment configuration at startup
 */
export function validateConfig() {
  const errors = [];
  if (!config.mongodb.uri) errors.push('MONGODB_URI is required');
  if (config.workspace.width <= 0) errors.push('WORKSPACE_WIDTH must be greater than 0');
  if (config.workspace.height <= 0) errors.push('WORKSPACE_HEIGHT must be greater than 0');
  if (config.workspace.proximityRadius <= 0) errors.push('PROXIMITY_RADIUS must be greater than 0');

  if (errors.length > 0) {
    throw new Error(`Configuration Validation Failed:\n${errors.join('\n')}`);
  }
}
