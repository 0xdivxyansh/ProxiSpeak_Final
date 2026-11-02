/**
 * Final Proxispeak - Express Application Setup
 */

import express from 'express';
import morgan from 'morgan';
import { configureSecurityMiddleware } from './middleware/security.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { apiRouter } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // Logging (in non-test environments)
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Security Headers & CORS
  configureSecurityMiddleware(app);

  // Request body parsing with strict size limits
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // API Rate Limiting
  app.use('/api', apiLimiter);

  // Mount Master API Router
  app.use('/api', apiRouter);

  // 404 Handler
  app.use(notFoundHandler);

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}

