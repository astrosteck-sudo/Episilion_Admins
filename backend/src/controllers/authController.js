const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const [rows] = await db.query('SELECT * FROM team_users WHERE email = ?', [email.toLowerCase()]);
    const user = rows[0];
    const invalid = () => res.status(401).json({ message: 'Invalid email or password' });

    if (!user) return invalid();
    if (user.status !== 'active') return res.status(403).json({ message: 'Account suspended' });
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.status(423).json({ message: 'Account temporarily locked. Try again later.' });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      const attempts = user.failed_attempts + 1;
      if (attempts >= MAX_ATTEMPTS) {
        await db.query(
          'UPDATE team_users SET failed_attempts = 0, locked_until = DATE_ADD(NOW(), INTERVAL ? MINUTE) WHERE id = ?',
          [LOCK_MINUTES, user.id]
        );
      } else {
        await db.query('UPDATE team_users SET failed_attempts = ? WHERE id = ?', [attempts, user.id]);
      }
      return invalid();
    }

    await db.query(
      'UPDATE team_users SET failed_attempts = 0, locked_until = NULL, last_login_at = NOW() WHERE id = ?',
      [user.id]
    );

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.TEAM_JWT_SECRET,
      { expiresIn: process.env.TEAM_JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.me = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, full_name, email, role, status FROM team_users WHERE id = ?',
      [req.teamUser.id]
    );
    const user = rows[0];
    if (!user || user.status !== 'active') {
      return res.status(401).json({ message: 'Account unavailable' });
    }
    res.json({ user });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const MIN_PASSWORD_LENGTH = 8;

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return res
        .status(400)
        .json({ message: `New password must be at least ${MIN_PASSWORD_LENGTH} characters` });
    }

    if (newPassword === currentPassword) {
      return res
        .status(400)
        .json({ message: 'New password must be different from the current password' });
    }

    const [rows] = await db.query(
      'SELECT id, password_hash, status FROM team_users WHERE id = ?',
      [req.teamUser.id]
    );
    const user = rows[0];
    if (!user || user.status !== 'active') {
      return res.status(401).json({ message: 'Account unavailable' });
    }

    const ok = await bcrypt.compare(currentPassword, user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.query('UPDATE team_users SET password_hash = ? WHERE id = ?', [
      passwordHash,
      user.id,
    ]);

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};