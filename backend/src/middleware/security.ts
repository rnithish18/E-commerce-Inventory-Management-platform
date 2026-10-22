import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { AppError } from './errorHandler';

// 1. Rate limiter for authentication routes (login/register)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV !== 'production',
  message: {
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

// 2. Rate limiter for coupon code validation (brute-force defense)
export const couponLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 40, // 40 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV !== 'production',
  message: {
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many coupon check attempts. Please slow down.',
  },
});

// 3. CSRF / Origin Verification Middleware for state-mutating requests
export function csrfProtection(req: Request, _res: Response, next: NextFunction): void {
  // Safe HTTP methods do not require origin validation
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip in non-production or webhook endpoints (which use HMAC raw signatures)
  if (process.env.NODE_ENV !== 'production' || req.originalUrl.includes('/webhooks')) {
    return next();
  }

  const origin = req.headers.origin || req.headers.referer;
  if (!origin) {
    // Direct server-to-server or scripts without origin are blocked if cookie auth is present
    if (req.cookies && req.cookies.token) {
      return next(new AppError(403, 'Missing Origin or Referer header on state change', 'CSRF_BLOCKED'));
    }
    return next();
  }

  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4000',
    'http://127.0.0.1:4000',
  ];

  const originUrl = new URL(origin);
  const originBase = `${originUrl.protocol}//${originUrl.host}`;

  const isAllowed = allowedOrigins.some(allowed => {
    try {
      const allowedUrl = new URL(allowed);
      return allowedUrl.host === originUrl.host;
    } catch {
      return false;
    }
  });

  if (!isAllowed) {
    return next(new AppError(403, `CORS / CSRF origin rejected: ${originBase}`, 'FORBIDDEN_ORIGIN'));
  }

  next();
}
