/**
 * Final Proxispeak - Truthful Health & Readiness Controller
 */

import { getDatabaseStatus } from '../config/database.js';
import { getRedisStatus } from '../redis/redisClient.js';
import { config } from '../config/index.js';

export function getHealth(req, res) {
  const dbStatus = getDatabaseStatus();
  const redisStatus = getRedisStatus();

  // Determine overall readiness
  const isHealthy = dbStatus.status === 'connected';

  const response = {
    status: isHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    services: {
      mongodb: dbStatus,
      redis: redisStatus
    },
    workspace: {
      width: config.workspace.width,
      height: config.workspace.height,
      proximityRadius: config.workspace.proximityRadius,
      hysteresisBuffer: config.workspace.hysteresisBuffer
    },
    version: '1.0.0',
    environment: config.env
  };

  res.status(isHealthy ? 200 : 503).json(response);
}

