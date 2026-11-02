/**
 * Final Proxispeak - Redis Client & Adapter Manager
 */

import Redis from 'ioredis';
import { createAdapter } from '@socket.io/redis-adapter';
import { config } from '../config/index.js';

let pubClient = null;
let subClient = null;
let redisStatus = {
  status: 'disconnected',
  mode: 'standalone',
  url: config.redis.url,
  lastError: null
};

export function createRedisClient(url = config.redis.url, options = {}) {
  const client = new Redis(url, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 5 && !config.redis.required) {
        return null; // Stop retrying if not strictly required
      }
      return Math.min(times * 100, 2000);
    },
    lazyConnect: true,
    ...options
  });

  return client;
}

export async function initializeRedis(io = null) {
  try {
    pubClient = createRedisClient(config.redis.url);
    subClient = pubClient.duplicate();

    pubClient.on('connect', () => {
      redisStatus.status = 'connected';
      redisStatus.lastError = null;
      console.log('[Redis] Publisher client connected');
    });

    pubClient.on('error', (err) => {
      redisStatus.lastError = err.message;
      console.warn(`[Redis] Publisher error: ${err.message}`);
    });

    subClient.on('error', (err) => {
      redisStatus.lastError = err.message;
      console.warn(`[Redis] Subscriber error: ${err.message}`);
    });

    await Promise.all([pubClient.connect(), subClient.connect()]);

    if (io) {
      io.adapter(createAdapter(pubClient, subClient));
      redisStatus.mode = 'redis-adapter';
      console.log('[Redis] Socket.IO Redis Adapter activated for multi-instance scaling');
    }

    return { pubClient, subClient };
  } catch (error) {
    redisStatus.status = 'error';
    redisStatus.lastError = error.message;

    if (config.redis.required) {
      throw error;
    } else {
      console.warn(`[Redis] Warning: Redis unavailable (${error.message}). Running in single-instance standalone mode.`);
      redisStatus.mode = 'standalone-fallback';
      return null;
    }
  }
}

export function getRedisStatus() {
  return {
    ...redisStatus,
    isAvailable: redisStatus.status === 'connected'
  };
}

export async function closeRedis() {
  const promises = [];
  if (pubClient) {
    promises.push(pubClient.quit().catch(() => pubClient.disconnect()));
  }
  if (subClient) {
    promises.push(subClient.quit().catch(() => subClient.disconnect()));
  }
  await Promise.all(promises);
  redisStatus.status = 'disconnected';
  console.log('[Redis] Connections closed');
}

export function getRedisClients() {
  return { pubClient, subClient };
}
