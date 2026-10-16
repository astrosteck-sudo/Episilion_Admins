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
  // Left open until CORS_ORIGINS is configured: blocking here would lock every
  // browser build out of the API (web calls always carry an Origin header),
  // including the login request itself.
  if (allowedOrigins.length === 0) return true;
  return allowedOrigins.includes(origin);
}

const corsOptions = {
  origin(origin, callback) {
    if (isOriginAllowed(origin)) return callback(null, true);
    return callback(new Error(`Origin not allowed: ${origin}`));
  },
  credentials: true,
  // `X-Client-Platform` is set by the app's API client, so the browser preflight
  // has to be told it is allowed.
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-Platform'],
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
 * Hosted web builds may call the API from a different site, requiring a secure
 * cross-site cookie. Production defaults to `SameSite=None`; local development
 * stays on `Lax`. Configure CORS_ORIGINS in production to allow only the web
 * app's credentialed cross-origin requests.
 */
const cookieOptions = {
  httpOnly: true,
  secure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : process.env.NODE_ENV === 'production',
  sameSite: process.env.COOKIE_SAME_SITE || (process.env.NODE_ENV === 'production' ? 'none' : 'lax'),
  path: '/',
};

module.exports = {
  allowedOrigins,
  corsOptions,
  requireTrustedOrigin,
  COOKIE_NAME,
  cookieOptions,
};
