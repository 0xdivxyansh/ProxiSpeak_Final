/**
 * Final Proxispeak - Security & CORS Middleware
 */

import helmet from 'helmet';
import cors from 'cors';
import { config } from '../config/index.js';

export function configureSecurityMiddleware(app) {
  // 1. Helmet HTTP Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          connectSrc: ["'self'", config.frontendUrl, 'ws:', 'wss:'],
          mediaSrc: ["'self'", 'blob:'],
          objectSrc: ["'none'"]
        }
      },
      crossOriginEmbedderPolicy: false
    })
  );

  // 2. CORS configuration with explicit origin allowlist
  const allowedOrigins = [
    config.frontendUrl,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS origin not allowed: ${origin}`));
        }
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    })
  );
}

