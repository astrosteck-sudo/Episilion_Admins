const bcrypt = require('bcrypt');
const db = require('../config/db');

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72;

exports.listSubAdmins = async (_req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, full_name, email, status, last_login_at, created_at
       FROM team_users
       WHERE role = 'sub_admin'
       ORDER BY full_name ASC, id ASC`
    );

    res.json({ subAdmins: rows });
  } catch (err) {
    console.error('List sub-admins error:', err);
    res.status(500).json({ message: 'Failed to load sub-admins' });
  }
};

exports.createSubAdmin = async (req, res) => {
  try {
    const fullName = typeof req.body?.full_name === 'string' ? req.body.full_name.trim() : '';
    const email =
      typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and sign-in password are required' });
    }
    if (fullName.length > 120) {
      return res.status(400).json({ message: 'Name must be 120 characters or fewer' });
    }
    if (email.length > 190 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Enter a valid email address' });
    }
    if (
      password.length < MIN_PASSWORD_LENGTH ||
      Buffer.byteLength(password, 'utf8') > MAX_PASSWORD_LENGTH
    ) {
      return res.status(400).json({
        message: `Sign-in password must be at least ${MIN_PASSWORD_LENGTH} characters and no more than ${MAX_PASSWORD_LENGTH} UTF-8 bytes`,
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await db.query(
      `INSERT INTO team_users (full_name, email, password_hash, role, status, created_by)
       VALUES (?, ?, ?, 'sub_admin', 'active', ?)`,
      [fullName, email, passwordHash, req.teamUser.id]
    );
    const [rows] = await db.query(
      `SELECT id, full_name, email, status, last_login_at, created_at
       FROM team_users
       WHERE id = ?`,
      [result.insertId]
    );

    res.status(201).json({ subAdmin: rows[0] });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }
    console.error('Create sub-admin error:', err);
    res.status(500).json({ message: 'Failed to create sub-admin' });
  }
};
