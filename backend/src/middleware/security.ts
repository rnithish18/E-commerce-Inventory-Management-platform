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

// 3. Rate limiter for payment processing & verification
export const paymentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30, // 30 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV !== 'production',
  message: {
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many payment attempts. Please try again shortly.',
  },
});

// 4. Rate limiter for image uploads (20 requests per minute)
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many image upload attempts. Please slow down.',
  },
});

// 5. Rate limiter for AI image analysis & search (20 requests per minute)
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many AI analysis requests. Please try again shortly.',
  },
});

// 6. Rate limiter for contact form inquiries (10 inquiries per 15 minutes)
export const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many contact messages sent. Please wait a few minutes before sending another inquiry.',
  },
});

// ---------------------------------------------------------------------------
// 7. CSRF / Origin Guard — deployment-safe, no-secret logging
// ---------------------------------------------------------------------------

/**
 * Normalise an origin/URL string for comparison:
 *  - lowercase
 *  - strip trailing slash
 *  - return only scheme+host (no path, no query)
 * Returns null if the value is not a valid URL.
 */
export function normaliseOrigin(raw: string): string | null {
  try {
    const u = new URL(raw.trim().toLowerCase());
    return `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }
}

/**
 * Build the allowed-origin set from environment variables.
 * Sources (all normalised before comparison):
 *  - ALLOWED_ORIGINS  — comma-separated list (primary)
 *  - PUBLIC_URL       — the app's canonical public URL (Render, Railway, etc.)
 *  - RENDER_EXTERNAL_URL — injected automatically by Render
 *  - FRONTEND_URL     — dev convenience / legacy
 *  - localhost variants always added in non-production
 */
export function buildAllowedOrigins(): Set<string> {
  const raw: string[] = [];

  for (const envKey of ['ALLOWED_ORIGINS', 'PUBLIC_URL', 'RENDER_EXTERNAL_URL', 'FRONTEND_URL']) {
    const val = process.env[envKey];
    if (val) {
      // ALLOWED_ORIGINS is comma-separated; others are single values
      raw.push(...val.split(',').map(s => s.trim()).filter(Boolean));
    }
  }

  // Always allow localhost in non-production so local dev & tests work
  if (process.env.NODE_ENV !== 'production') {
    raw.push(
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:4000',
      'http://127.0.0.1:4000',
    );
  }

  const set = new Set<string>();
  for (const r of raw) {
    const norm = normaliseOrigin(r);
    if (norm) set.add(norm);
  }
  return set;
}

/**
 * Derive the server's own origin from the incoming request.
 * With `app.set('trust proxy', 1)` Render's proxy headers are trusted.
 *
 * Priority:
 *  1. X-Forwarded-Host (set by reverse proxies / Render)
 *  2. Host header
 */
function getServerOrigin(req: Request): string | null {
  const proto = (req.headers['x-forwarded-proto'] as string | undefined)
    || (req.secure ? 'https' : 'http');
  const host = (req.headers['x-forwarded-host'] as string | undefined)
    || req.headers['host'];
  if (!host) return null;
  // X-Forwarded-Host may contain a comma-separated list; use the first value
  const firstHost = host.split(',')[0].trim();
  return normaliseOrigin(`${proto}://${firstHost}`);
}

/**
 * CSRF / Origin Guard middleware.
 *
 * Rules (applied only to state-mutating verbs: POST / PUT / PATCH / DELETE):
 *
 * 1. Webhook routes (/api/v1/webhooks/**) → exempt (HMAC-verified, server-to-server).
 * 2. No Origin header:
 *    - If a session cookie is present → 403 (browser must always send Origin).
 *    - Otherwise → allow (curl, Postman, server-to-server without cookie).
 * 3. Origin == server's own host → allow (same-origin request).
 * 4. Origin in allowedOrigins set → allow (cross-origin from a known frontend).
 * 5. Otherwise → 403, log the rejected origin + allowed list at WARN level.
 */
export function csrfProtection(req: Request, _res: Response, next: NextFunction): void {
  // Safe methods never need origin validation
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  // Webhooks are server-to-server and HMAC-verified — always exempt
  if (req.originalUrl.includes('/webhooks')) return next();

  const originHeader = req.headers.origin || req.headers.referer;

  if (!originHeader) {
    // A browser making a cross-origin form POST always sends Origin.
    // If the cookie is present but Origin is absent something is wrong.
    if (req.cookies?.token) {
      console.warn('[CSRF] Blocked: state-mutating request with session cookie but no Origin header', {
        method: req.method,
        path: req.path,
        ip: req.ip,
      });
      return next(new AppError(403, 'Missing Origin header on authenticated state-change request', 'CSRF_BLOCKED'));
    }
    // No cookie, no origin → non-browser client, allow
    return next();
  }

  const requestedOrigin = normaliseOrigin(originHeader);
  if (!requestedOrigin) {
    console.warn('[CSRF] Blocked: unparseable Origin header', { originHeader, path: req.path });
    return next(new AppError(403, 'Malformed Origin header', 'FORBIDDEN_ORIGIN'));
  }

  // Rule 3: same-origin
  const serverOrigin = getServerOrigin(req);
  if (serverOrigin && requestedOrigin === serverOrigin) return next();

  // Rule 4: explicitly allowed
  const allowed = buildAllowedOrigins();
  if (allowed.has(requestedOrigin)) return next();

  // Rule 5: reject — log origin + allowed list (no secrets)
  console.warn('[CSRF] Blocked request from disallowed origin', {
    rejectedOrigin: requestedOrigin,
    serverOrigin,
    allowedOrigins: [...allowed],
    method: req.method,
    path: req.path,
  });
  return next(new AppError(403, `Origin not allowed: ${requestedOrigin}`, 'FORBIDDEN_ORIGIN'));
}

