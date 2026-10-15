/**
 * Records which client made the request.
 *
 * The same API serves the native app (iOS / Android) and the web build, and a
 * few behaviours legitimately differ between them — token delivery, CORS and
 * upload handling. Those places read `req.clientPlatform` instead of sniffing
 * the User-Agent, which is unreliable and easy to spoof.
 *
 * The header is advisory only: it is never used for authentication or
 * authorisation, so an unknown or forged value is harmless.
 */

const KNOWN_PLATFORMS = new Set(['web', 'ios', 'android']);

function readClientPlatform(req) {
  const raw = req.headers['x-client-platform'];
  if (typeof raw !== 'string') return 'unknown';
  const value = raw.trim().toLowerCase();
  return KNOWN_PLATFORMS.has(value) ? value : 'unknown';
}

function clientPlatform(req, res, next) {
  req.clientPlatform = readClientPlatform(req);
  next();
}

module.exports = { clientPlatform, readClientPlatform, KNOWN_PLATFORMS };
