/**
 * Final Proxispeak - Main HTTP & WebSocket Server Entrypoint
 */

import http from 'http';
import { config, validateConfig } from './config/index.js';
import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { initializeRedis, closeRedis } from './redis/redisClient.js';
import { initializeSockets } from './sockets/index.js';
import { seedDefaultLayout } from './services/layoutService.js';
import { getAllRoomsWithStats } from './services/roomService.js';

async function bootstrap() {
  console.log('====================================================');
  console.log('  Final Proxispeak - Geospatial Proximity Ecosystem ');
  console.log('====================================================');

  try {
    // 1. Validate environment configuration
    validateConfig();

    // 2. Initialize Express application & HTTP server
    const app = createApp();
    const server = http.createServer(app);

    // 3. Initialize WebSockets (Socket.IO)
    const { io } = initializeSockets(server);

    // 4. Connect to MongoDB
    try {
      await connectDatabase();
      // Seed default office layout and default room in MongoDB
      await seedDefaultLayout();
      await getAllRoomsWithStats();
    } catch (dbError) {
      console.warn(`[MongoDB] Initial connection notice: ${dbError.message}`);
    }

    // 5. Connect to Redis & attach Redis adapter if enabled
    try {
      await initializeRedis(io);
    } catch (redisError) {
      console.warn(`[Redis] Startup note: ${redisError.message}`);
    }

    // 6. Start listening
    const PORT = config.port;
    server.listen(PORT, () => {
      console.log(`[Server] Final Proxispeak running on port ${PORT}`);
      console.log(`[Server] Health Endpoint: http://localhost:${PORT}/api/health`);
      console.log(`[Server] Rooms Endpoint:  http://localhost:${PORT}/api/rooms`);
      console.log(`[Server] Layouts Endpoint: http://localhost:${PORT}/api/layouts`);
      console.log(`[Server] Environment:     ${config.env}`);
    });

    // 7. Graceful Shutdown Handlers
    async function gracefulShutdown(signal) {
      console.log(`\n[Server] Received ${signal}. Starting graceful shutdown...`);

      // Close HTTP server & reject new requests
      server.close(() => {
        console.log('[Server] HTTP server closed');
      });

      // Close Socket.IO connections
      io.close(() => {
        console.log('[Server] Socket.IO server closed');
      });

      // Disconnect Redis
      await closeRedis();

      // Disconnect MongoDB
      await disconnectDatabase();

      console.log('[Server] Graceful shutdown complete. Exiting process.');
      process.exit(0);
    }

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return { server, app, io };
  } catch (fatalError) {
    console.error(`[Server] Fatal bootstrap error: ${fatalError.message}`);
    process.exit(1);
  }
}

// Start server if executed directly
if (process.env.NODE_ENV !== 'test') {
  bootstrap();
}

export { bootstrap };

