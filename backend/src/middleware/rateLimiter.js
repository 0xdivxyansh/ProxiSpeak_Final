/**
 * Final Proxispeak - HTTP Rate Limiting Middleware
 */

import rateLimit from 'express-rate-limit';

// Standard rate limiter for all general API requests: 100 requests per minute
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again after a minute',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  }
});

// Stricter rate limiter for resource creation (e.g. creating rooms): 20 requests per minute
export const creationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many creation requests, please wait before creating more resources',
      code: 'CREATION_RATE_LIMIT_EXCEEDED'
    }
  }
});

