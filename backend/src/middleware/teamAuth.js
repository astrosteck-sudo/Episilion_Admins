const jwt = require('jsonwebtoken');
const { COOKIE_NAME } = require('../config/security');

/**
 * Reads the token from the httpOnly cookie (web) or the Authorization header
 * (native app, which has no cookie jar).
 */
function extractToken(req) {
  if (req.cookies && req.cookies[COOKIE_NAME]) return req.cookies[COOKIE_NAME];
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

exports.verifyTeamToken = (req, res, next) => {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ message: 'Not authenticated' });
  try {
    req.teamUser = jwt.verify(token, process.env.TEAM_JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

exports.requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.teamUser.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};