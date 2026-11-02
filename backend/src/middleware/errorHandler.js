/**
 * Final Proxispeak - Centralized Express Error Handling Middleware
 */

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // Log error internally with request context
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, {
    message: err.message,
    statusCode,
    stack: isProduction ? undefined : err.stack
  });

  // Never expose internal stack traces or database errors to the client
  res.status(statusCode).json({
    success: false,
    error: {
      message: statusCode === 500 && isProduction ? 'Internal Server Error' : err.message,
      code: err.code || 'SERVER_ERROR',
      details: err.details || undefined
    },
    timestamp: new Date().toISOString()
  });
}

export function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: {
      message: `Resource not found: ${req.method} ${req.originalUrl}`,
      code: 'NOT_FOUND'
    },
    timestamp: new Date().toISOString()
  });
}

