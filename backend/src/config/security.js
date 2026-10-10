/**
 * CORS and cookie policy for the team API.
 *
 * The native app talks to this API without an Origin header, while the web build
 * is served from a different origin, so both have to be supported.
 */

/** Comma-separated allowlist, e.g. "https://app.episilion.com,http://localhost:8081". */
function parseOrigins(value) {
  return (value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const allowedOrigins = parseOrigins(process.env.CORS_ORIGINS);

/**
 * Requests without an Origin header (native app, curl, server-to-server) are
 * always allowed: browsers always attach Origin to cross-origin requests, so a
 * missing header cannot be a CSRF attempt.
 */
function isOriginAllowed(origin) {
  if (!origin) return true;
  if (allowedOrigins.length === 0) return true; // not configured yet: allow all
  return allowedOrigins.includes(origin);
}

const corsOptions = {
  origin(origin, callback) {
    if (isOriginAllowed(origin)) return callback(null, true);
    return callback(new Error(`Origin not allowed: ${origin}`));
  },
  credentials: true,
};

/**
 * Blocks cross-site state-changing requests.
 *
 * The auth token lives in a cookie, so the browser attaches it automatically and
 * CORS alone would not stop a forged request from being *sent*. Checking Origin
 * on mutations closes that gap.
 */
function requireTrustedOrigin(req, res, next) {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }
  if (isOriginAllowed(req.headers.origin)) return next();
  return res.status(403).json({ message: 'Request blocked: untrusted origin' });
}

const COOKIE_NAME = 'episilion_team_token';

/**
 * `SameSite=None` is required when the web app and the API are on different
 * sites, and it only works over HTTPS. Set COOKIE_SAME_SITE=none in that case.
 */
const cookieOptions = {
  httpOnly: true,
  secure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : process.env.NODE_ENV === 'production',
  sameSite: process.env.COOKIE_SAME_SITE || 'lax',
  path: '/',
};

module.exports = {
  allowedOrigins,
  corsOptions,
  requireTrustedOrigin,
  COOKIE_NAME,
  cookieOptions,
};
