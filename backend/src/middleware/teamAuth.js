const jwt = require('jsonwebtoken');

exports.verifyTeamToken = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
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