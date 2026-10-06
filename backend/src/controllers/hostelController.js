const crypto = require('crypto');
const db = require('../config/db');
const { uploadBuffer, isConfigured } = require('../config/cloudinary');

/* ---------------------------------- helpers --------------------------------- */

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const num = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const bool = (value) => {
  if (value === undefined || value === null || value === '') return null;
  return value === true || value === 'true' || value === '1' || value === 1;
};

const str = (value) => {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  return s === '' ? null : s;
};

/** Accepts a JSON array, a comma separated string, or a repeated form field. */
const parseList = (value) => {
  if (value === undefined || value === null || value === '') return [];
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === 'string') {
    const raw = value.trim();
    if (raw.startsWith('[')) {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.map((v) => String(v).trim()).filter(Boolean) : [];
      } catch {
        return [];
      }
    }
    return raw.split(',').map((v) => v.trim()).filter(Boolean);
  }
  return [];
};

/** `room_types` is posted as a JSON array of `{ type, price }` objects. */
const parseRoomTypes = (value) => {
  if (!value) return [];

  let items = value;
  if (typeof value === 'string') {
    const raw = value.trim();
    if (!raw.startsWith('[')) return [];
    try {
      items = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const type = str(item.type || item.room_type);
      return type ? { type, price: num(item.price) } : null;
    })
    .filter(Boolean);
};

/** Builds a unique, url friendly hostel_id (max 50 chars, matches the existing PK). */
async function generateHostelId(conn, name) {
  const base = slugify(name).slice(0, 40) || 'hostel';
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const suffix = crypto.randomBytes(3).toString('hex');
    const candidate = `${base}-${suffix}`.slice(0, 50);
    const [rows] = await conn.query('SELECT 1 FROM hostels WHERE hostel_id = ? LIMIT 1', [candidate]);
    if (rows.length === 0) return candidate;
  }
  return `${base.slice(0, 33)}-${Date.now().toString(36)}`.slice(0, 50);
}

/* ----------------------------------- create --------------------------------- */

/**
 * POST /api/team/hostels   (sub_admin)
 * multipart/form-data. Text fields + up to 6 `photos` image files.
 * Creates the hostel in `pending` state and logs the submission.
 */
exports.createHostel = async (req, res) => {
  const body = req.body || {};
  const name = str(body.name || body.hostel_name);

  const latitude = num(body.latitude);
  const longitude = num(body.longitude);
  const managerName = str(body.manager_name || body.managerName);
  const phone = str(body.phone);
  const email = str(body.email);
  const university = str(body.university);

  const files = Array.isArray(req.files) ? req.files : [];

  const missing = [];
  if (!name) missing.push('name');
  if (latitude === null) missing.push('latitude');
  if (longitude === null) missing.push('longitude');
  if (!managerName) missing.push('manager_name');
  if (!phone) missing.push('phone');
  if (files.length === 0) missing.push('photos');

  if (missing.length) {
    return res.status(400).json({ message: `Missing required fields: ${missing.join(', ')}` });
  }

  if (!isConfigured()) {
    return res.status(503).json({
      message: 'Image uploads are not configured. Set CLOUDINARY_* environment variables.',
    });
  }

  const conn = await db.getConnection();
  try {
    // 1) Push every photo to Cloudinary first so a failed upload never leaves a half row.
    const uploaded = [];
    for (const file of files) {
      const { url, publicId } = await uploadBuffer(file.buffer, 'episilion/hostels');
      uploaded.push({ url, publicId, type: 'image' });
    }

    const hostelId = await generateHostelId(conn, name);
    const roomTypes = parseRoomTypes(body.room_types || body.roomTypes);
    const amenities = parseList(body.amenities);
    const furnishings = parseList(body.furnishing);
    const rules = parseList(body.rules);

    await conn.beginTransaction();

    await conn.query(
      `INSERT INTO hostels
         (hostel_id, name, type, university, year_established, main_image,
          total_reviews, average_rating, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, 0, 0.0, 'pending', ?)`,
      [
        hostelId,
        name,
        str(body.type) || 'Hostel',
        university,
        num(body.year_established),
        uploaded[0].url,
        req.teamUser.id,
      ]
    );

    await conn.query(
      `INSERT INTO locations
         (hostel_id, distance_to_campus_in_minutes, directions, latitude, longitude)
       VALUES (?, ?, ?, ?, ?)`,
      [
        hostelId,
        num(body.distance_to_campus_in_minutes),
        str(body.directions),
        latitude,
        longitude,
      ]
    );

    await conn.query(
      `INSERT INTO contact
         (hostel_id, manager_name, phone, whatsapp, email, office_hours, website)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        hostelId,
        managerName,
        phone,
        str(body.whatsapp) || phone,
        email,
        str(body.office_hours) || '5:00am to 12:00am',
        str(body.website),
      ]
    );

    for (const room of roomTypes) {
      await conn.query(
        'INSERT INTO rooms (hostel_id, room_type, price, available_rooms) VALUES (?, ?, ?, ?)',
        [hostelId, room.type, room.price, num(body.available_rooms)]
      );
    }

    for (const amenity of amenities) {
      await conn.query('INSERT INTO amenities (hostel_id, amenity) VALUES (?, ?)', [hostelId, amenity]);
    }

    for (const item of furnishings) {
      await conn.query('INSERT INTO furnishing (hostel_id, furnishing) VALUES (?, ?)', [hostelId, item]);
    }

    for (const rule of rules) {
      await conn.query('INSERT INTO rules (hostel_id, rule) VALUES (?, ?)', [hostelId, rule]);
    }

    for (const photo of uploaded) {
      await conn.query('INSERT INTO media (hostel_id, url, type) VALUES (?, ?, ?)', [
        hostelId,
        photo.url,
        photo.type,
      ]);
    }

    const priceMin = num(body.price_min);
    const priceMax = num(body.price_max);
    const installmentAllowed = bool(body.installment_allowed);
    const hasPricing =
      priceMin !== null ||
      priceMax !== null ||
      str(body.billing_period) ||
      installmentAllowed !== null ||
      num(body.utilities_fee) !== null ||
      num(body.maintenance_fee) !== null ||
      num(body.caution_deposit) !== null;

    if (hasPricing) {
      await conn.query(
        `INSERT INTO pricing
           (hostel_id, price_min, price_max, billing_period, installment_allowed,
            utilities_fee, maintenance_fee, caution_deposit, refund_policy)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          hostelId,
          priceMin,
          priceMax,
          str(body.billing_period),
          installmentAllowed,
          num(body.utilities_fee),
          num(body.maintenance_fee),
          num(body.caution_deposit),
          str(body.refund_policy),
        ]
      );
    }

    await conn.query(
      `INSERT INTO hostel_review_log (hostel_id, action, performed_by, note)
       VALUES (?, 'submitted', ?, ?)`,
      [hostelId, req.teamUser.id, `Submitted by ${req.teamUser.email}`]
    );

    await conn.commit();

    res.status(201).json({
      message: 'Hostel submitted for approval',
      hostel: { hostel_id: hostelId, name, status: 'pending', main_image: uploaded[0].url },
    });
  } catch (err) {
    try {
      await conn.rollback();
    } catch {
      /* rollback is best effort */
    }
    console.error('createHostel error:', err);
    res.status(500).json({ message: err.message || 'Failed to submit hostel' });
  } finally {
    conn.release();
  }
};

/* ------------------------------------ list ---------------------------------- */

/**
 * GET /api/team/hostels?status=pending|approved|rejected|all
 * super_admin sees everything, sub_admin only sees what they submitted.
 */
exports.listHostels = async (req, res) => {
  try {
    const status = str(req.query.status) || 'pending';
    const where = [];
    const params = [];

    if (status !== 'all') {
      where.push('h.status = ?');
      params.push(status);
    }
    if (req.teamUser.role !== 'super_admin') {
      where.push('h.created_by = ?');
      params.push(req.teamUser.id);
    }

    const [rows] = await db.query(
      `SELECT
         h.hostel_id, h.name, h.type, h.university, h.year_established,
         h.main_image, h.status, h.rejection_reason,
         h.created_at, h.reviewed_at, h.reviewed_by,
         l.latitude, l.longitude, l.distance_to_campus_in_minutes, l.directions,
         c.manager_name, c.phone, c.whatsapp, c.email, c.office_hours, c.website,
         (SELECT MIN(price) FROM rooms r WHERE r.hostel_id = h.hostel_id) AS price_min,
         (SELECT MAX(price) FROM rooms r WHERE r.hostel_id = h.hostel_id) AS price_max,
         (SELECT COUNT(*) FROM media m WHERE m.hostel_id = h.hostel_id) AS photo_count,
         (SELECT COUNT(*) FROM amenities a WHERE a.hostel_id = h.hostel_id) AS amenity_count,
         (SELECT COUNT(*) FROM rooms r WHERE r.hostel_id = h.hostel_id) AS room_count,
         u.full_name AS submitted_by_name
       FROM hostels h
       LEFT JOIN locations l ON l.hostel_id = h.hostel_id
       LEFT JOIN contact c ON c.hostel_id = h.hostel_id
       LEFT JOIN team_users u ON u.id = h.created_by
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY h.created_at DESC, h.hostel_id DESC`,
      params
    );

    res.json({ hostels: rows });
  } catch (err) {
    console.error('listHostels error:', err);
    res.status(500).json({ message: 'Failed to load hostels' });
  }
};

/* ----------------------------------- detail --------------------------------- */

/** GET /api/team/hostels/:id  — everything the review screen needs. */
exports.getHostel = async (req, res) => {
  try {
    const { id } = req.params;

    const [hostelRows] = await db.query(
      `SELECT h.*, u.full_name AS submitted_by_name, u.email AS submitted_by_email,
              rv.full_name AS reviewed_by_name
       FROM hostels h
       LEFT JOIN team_users u ON u.id = h.created_by
       LEFT JOIN team_users rv ON rv.id = h.reviewed_by
       WHERE h.hostel_id = ?`,
      [id]
    );

    const hostel = hostelRows[0];
    if (!hostel) return res.status(404).json({ message: 'Hostel not found' });

    if (req.teamUser.role !== 'super_admin' && hostel.created_by !== req.teamUser.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const [[locations], [contacts], [rooms], [amenities], [furnishing], [rules], [media], [pricing], [log]] =
      await Promise.all([
        db.query('SELECT * FROM locations WHERE hostel_id = ? LIMIT 1', [id]),
        db.query('SELECT * FROM contact WHERE hostel_id = ? LIMIT 1', [id]),
        db.query('SELECT * FROM rooms WHERE hostel_id = ?', [id]),
        db.query('SELECT amenity FROM amenities WHERE hostel_id = ?', [id]),
        db.query('SELECT furnishing FROM furnishing WHERE hostel_id = ?', [id]),
        db.query('SELECT rule FROM rules WHERE hostel_id = ?', [id]),
        db.query('SELECT media_id, url, type FROM media WHERE hostel_id = ?', [id]),
        db.query('SELECT * FROM pricing WHERE hostel_id = ? LIMIT 1', [id]),
        db.query(
          `SELECT l.action, l.note, l.created_at, u.full_name AS performed_by_name
           FROM hostel_review_log l
           LEFT JOIN team_users u ON u.id = l.performed_by
           WHERE l.hostel_id = ? ORDER BY l.created_at ASC, l.id ASC`,
          [id]
        ),
      ]);

    res.json({
      hostel,
      location: locations[0] || null,
      contact: contacts[0] || null,
      rooms,
      amenities: amenities.map((a) => a.amenity),
      furnishing: furnishing.map((f) => f.furnishing),
      rules: rules.map((r) => r.rule),
      media,
      pricing: pricing[0] || null,
      log,
    });
  } catch (err) {
    console.error('getHostel error:', err);
    res.status(500).json({ message: 'Failed to load hostel' });
  }
};

/* ---------------------------------- decisions -------------------------------- */

async function decide(req, res, action) {
  const conn = await db.getConnection();
  try {
    const { id } = req.params;
    const reason = str(req.body?.reason || req.body?.rejection_reason);

    if (action === 'rejected' && !reason) {
      return res.status(400).json({ message: 'A rejection reason is required' });
    }

    await conn.beginTransaction();

    const [rows] = await conn.query('SELECT hostel_id, status FROM hostels WHERE hostel_id = ? FOR UPDATE', [id]);
    const hostel = rows[0];
    if (!hostel) {
      await conn.rollback();
      return res.status(404).json({ message: 'Hostel not found' });
    }
    if (hostel.status === action) {
      await conn.rollback();
      return res.status(409).json({ message: `Hostel is already ${action}` });
    }

    await conn.query(
      `UPDATE hostels
         SET status = ?, rejection_reason = ?, reviewed_by = ?, reviewed_at = NOW()
       WHERE hostel_id = ?`,
      [action, action === 'rejected' ? reason : null, req.teamUser.id, id]
    );

    await conn.query(
      `INSERT INTO hostel_review_log (hostel_id, action, performed_by, note)
       VALUES (?, ?, ?, ?)`,
      [id, action, req.teamUser.id, reason]
    );

    await conn.commit();

    res.json({ message: `Hostel ${action}`, hostel: { hostel_id: id, status: action } });
  } catch (err) {
    try {
      await conn.rollback();
    } catch {
      /* rollback is best effort */
    }
    console.error(`decide(${action}) error:`, err);
    res.status(500).json({ message: `Failed to ${action} hostel` });
  } finally {
    conn.release();
  }
}

/** PATCH /api/team/hostels/:id/approve  (super_admin) */
exports.approveHostel = (req, res) => decide(req, res, 'approved');

/** PATCH /api/team/hostels/:id/reject   (super_admin) body: { reason } */
exports.rejectHostel = (req, res) => decide(req, res, 'rejected');

/* ---------------------------------- counters --------------------------------- */

/** GET /api/team/hostels/stats  — dashboard counters. */
exports.getStats = async (req, res) => {
  try {
    const params = [];
    let scope = '';
    if (req.teamUser.role !== 'super_admin') {
      scope = 'WHERE created_by = ?';
      params.push(req.teamUser.id);
    }

    const [rows] = await db.query(
      `SELECT status, COUNT(*) AS total FROM hostels ${scope} GROUP BY status`,
      params
    );

    const stats = { pending: 0, approved: 0, rejected: 0, total: 0 };
    for (const row of rows) {
      stats[row.status] = Number(row.total);
      stats.total += Number(row.total);
    }

    res.json({ stats });
  } catch (err) {
    console.error('getStats error:', err);
    res.status(500).json({ message: 'Failed to load stats' });
  }
};
