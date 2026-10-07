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

/**
 * Standard house rules applied to every hostel when a super admin approves it.
 * Kept in the backend so sub admins never have to enter them per submission.
 */
const DEFAULT_RULES = [
  'Maintain your room',
  'No loud music',
  'No perching',
  'No permanent fixes, removables only',
  'No pets',
  'No smoking, drinking, weapons',
  'Visiting 6am to 11pm',
];

/**
 * How many perks are promoted to `amenities`, which is what the hostel card
 * shows. `furnishing` always holds the complete list of perks.
 */
const CARD_AMENITY_LIMIT = 3;

/**
 * Splits the selected perks between the two tables:
 *   - `furnishing` -> every perk (the hostel's full list of features)
 *   - `amenities`  -> only the first few, used for the short card display
 */
const splitPerks = (perks) => ({
  all: perks,
  card: perks.slice(0, CARD_AMENITY_LIMIT),
});

/**
 * Seeds the default rules for a hostel, skipping any that already exist.
 * Safe to call more than once thanks to the (hostel_id, rule) unique key.
 */
async function seedDefaultRules(conn, hostelId) {
  if (!DEFAULT_RULES.length) return 0;

  const values = DEFAULT_RULES.map(() => '(?, ?)').join(', ');
  const params = DEFAULT_RULES.flatMap((rule) => [hostelId, rule]);

  const [result] = await conn.query(
    `INSERT IGNORE INTO rules (hostel_id, rule) VALUES ${values}`,
    params
  );

  return result.affectedRows ?? 0;
}

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
    // The sub admin picks one list of perks; it is mirrored into both tables.
    const perks = splitPerks(parseList(body.perks || body.amenities));
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

    for (const amenity of perks.card) {
      await conn.query('INSERT INTO amenities (hostel_id, amenity) VALUES (?, ?)', [hostelId, amenity]);
    }

    for (const item of perks.all) {
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

    // Approving publishes the hostel, so it also receives the standard house rules.
    let rulesAdded = 0;
    if (action === 'approved') {
      rulesAdded = await seedDefaultRules(conn, id);
    }

    await conn.query(
      `INSERT INTO hostel_review_log (hostel_id, action, performed_by, note)
       VALUES (?, ?, ?, ?)`,
      [
        id,
        action,
        req.teamUser.id,
        rulesAdded > 0 ? `${reason ? `${reason}. ` : ''}Applied ${rulesAdded} default rules` : reason,
      ]
    );

    await conn.commit();

    res.json({
      message: `Hostel ${action}`,
      hostel: { hostel_id: id, status: action },
      defaultRulesApplied: rulesAdded,
    });
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

/* ----------------------------- update requests ------------------------------ */

/**
 * A sub admin cannot edit a hostel directly. They request permission with a
 * reason, and only an approved request unlocks the edit form for that hostel.
 */

/**
 * GET /api/team/hostels/update-candidates[?name=...]
 * Lists the hostels a team member can request an update for. Only live
 * (approved) hostels qualify — a pending or rejected submission is not on the
 * platform yet, so there is nothing to update. With no name it returns every
 * eligible hostel; with a name it narrows down. Each row carries its latest
 * update request so the app knows if it is locked or unlocked in one call.
 */
exports.listUpdateCandidates = async (req, res) => {
  try {
    const name = str(req.query.name);
    if (name && name.length < 2) {
      return res.status(400).json({ message: 'Enter at least 2 characters of the hostel name' });
    }

    // The correlated subquery returns only the newest request per hostel.
    const baseSql = `
      SELECT h.hostel_id, h.name, h.university, h.status,
             r.id AS req_id, r.reason AS req_reason, r.status AS req_status,
             r.decision_note AS req_decision_note, r.created_at AS req_created_at,
             r.reviewed_at AS req_reviewed_at,
             r.requested_by AS req_requested_by_id,
             rv.full_name AS req_reviewed_by_name
      FROM hostels h
      LEFT JOIN hostel_update_requests r ON r.id = (
        SELECT r2.id FROM hostel_update_requests r2
        WHERE r2.hostel_id = h.hostel_id
        ORDER BY r2.created_at DESC, r2.id DESC
        LIMIT 1
      )
      LEFT JOIN team_users rv ON rv.id = r.reviewed_by
      WHERE h.status = 'approved'`;

    let rows;
    if (!name) {
      [rows] = await db.query(`${baseSql} ORDER BY h.name ASC LIMIT 500`);
    } else {
      const runLookup = (condition, params) =>
        db.query(`${baseSql} AND ${condition} ORDER BY h.name ASC LIMIT 50`, params);
      [rows] = await runLookup('LOWER(h.name) = LOWER(?)', [name]);
      if (!rows.length) {
        [rows] = await runLookup('h.name LIKE ?', [`%${name}%`]);
      }
    }

    const self = Number(req.teamUser.id);
    const isSuperAdmin = req.teamUser.role === 'super_admin';

    res.json({
      matches: rows.map((row) => {
        const request =
          row.req_id === null
            ? null
            : {
                id: row.req_id,
                hostel_id: row.hostel_id,
                reason: row.req_reason,
                status: row.req_status,
                decision_note: row.req_decision_note,
                created_at: row.req_created_at,
                reviewed_at: row.req_reviewed_at,
                reviewed_by_name: row.req_reviewed_by_name,
              };

        const isMine = isSuperAdmin || Number(row.req_requested_by_id) === self;

        let requestState = null;
        if (request) {
          if (request.status === 'pending' && !isMine) {
            // Another admin's request is already in the queue.
            requestState = 'pending_other';
          } else {
            requestState = request.status;
          }
        }

        return {
          hostel_id: row.hostel_id,
          name: row.name,
          university: row.university,
          status: row.status,
          latest_request: request,
          latest_request_is_mine: isMine,
          request_state: requestState,
        };
      }),
    });
  } catch (err) {
    console.error('listUpdateCandidates error:', err);
    res.status(500).json({ message: 'Failed to load hostels' });
  }
};

/** POST /api/team/hostels/:id/update-requests   (sub_admin) body: { reason } */
exports.createUpdateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const reason = str(req.body?.reason);

    if (!reason) {
      return res.status(400).json({ message: 'A reason for the update is required' });
    }
    if (reason.length > 500) {
      return res.status(400).json({ message: 'The reason must be 500 characters or fewer' });
    }

    const [rows] = await db.query(
      'SELECT hostel_id, name, status FROM hostels WHERE hostel_id = ?',
      [id]
    );
    const hostel = rows[0];
    if (!hostel) return res.status(404).json({ message: 'Hostel not found' });

    // Only live hostels can be updated, matching what the picker offers.
    if (hostel.status !== 'approved') {
      return res
        .status(400)
        .json({ message: 'Only approved hostels can be updated' });
    }

    // Any team member may request an update for any approved hostel; the super
    // admin approval is the real gate. Only one request may await review per
    // hostel, so two admins cannot queue duplicate work for the super admin.
    const [existing] = await db.query(
      `SELECT id, requested_by FROM hostel_update_requests
       WHERE hostel_id = ? AND status = 'pending' LIMIT 1`,
      [id]
    );
    if (existing.length) {
      const mine = Number(existing[0].requested_by) === Number(req.teamUser.id);
      return res.status(409).json({
        message: mine
          ? 'You already have an update request awaiting review for this hostel'
          : 'This hostel already has an update request awaiting review',
      });
    }

    const [result] = await db.query(
      `INSERT INTO hostel_update_requests (hostel_id, requested_by, reason)
       VALUES (?, ?, ?)`,
      [id, req.teamUser.id, reason]
    );

    await db.query(
      `INSERT INTO hostel_review_log (hostel_id, action, performed_by, note)
       VALUES (?, 'update_requested', ?, ?)`,
      [id, req.teamUser.id, reason]
    );

    res.status(201).json({
      message: 'Update request sent for approval',
      request: {
        id: result.insertId,
        hostel_id: id,
        hostel_name: hostel.name,
        reason,
        status: 'pending',
      },
    });
  } catch (err) {
    console.error('createUpdateRequest error:', err);
    res.status(500).json({ message: 'Failed to send the update request' });
  }
};

/**
 * GET /api/team/hostels/update-requests?status=pending|approved|rejected|all
 * super_admin sees every request, sub_admin only their own.
 */
/** Human labels for the fields a sub admin can change. */
const FIELD_LABELS = {
  name: 'Name',
  type: 'Type',
  university: 'University',
  year_established: 'Year established',
  directions: 'Directions',
  distance_to_campus_in_minutes: 'Minutes to campus',
  latitude: 'Latitude',
  longitude: 'Longitude',
  manager_name: 'Manager name',
  phone: 'Phone',
  whatsapp: 'WhatsApp',
  email: 'Email',
  office_hours: 'Office hours',
  website: 'Website',
  price_min: 'Price from',
  price_max: 'Price to',
  billing_period: 'Billing period',
  installment_allowed: 'Installment allowed',
  utilities_fee: 'Utilities fee',
  maintenance_fee: 'Maintenance fee',
  caution_deposit: 'Caution deposit',
  refund_policy: 'Refund policy',
  rooms: 'Room types',
  perks: 'Perks',
  rules: 'House rules',
};

const displayValue = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  if (Array.isArray(value)) {
    if (!value.length) return '—';
    return value
      .map((item) =>
        item && typeof item === 'object'
          ? `${item.type}${item.price !== null && item.price !== undefined ? ` - ${item.price}` : ''}`
          : String(item)
      )
      .join(', ');
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
};

/**
 * The live values for the fields a change set can touch, so the super admin can
 * see exactly what would change rather than just that something changed.
 */
async function loadLiveValues(hostelId) {
  const [[hostelRows], [locations], [contacts], [rooms], [furnishing], [rules], [pricing]] =
    await Promise.all([
      db.query(
        'SELECT name, type, university, year_established FROM hostels WHERE hostel_id = ?',
        [hostelId]
      ),
      db.query('SELECT * FROM locations WHERE hostel_id = ? LIMIT 1', [hostelId]),
      db.query('SELECT * FROM contact WHERE hostel_id = ? LIMIT 1', [hostelId]),
      db.query('SELECT room_type, price FROM rooms WHERE hostel_id = ? ORDER BY room_id', [hostelId]),
      db.query('SELECT furnishing FROM furnishing WHERE hostel_id = ?', [hostelId]),
      db.query('SELECT rule FROM rules WHERE hostel_id = ?', [hostelId]),
      db.query('SELECT * FROM pricing WHERE hostel_id = ? LIMIT 1', [hostelId]),
    ]);

  const hostel = hostelRows[0] || {};
  const location = locations[0] || {};
  const contact = contacts[0] || {};
  const price = pricing[0] || {};

  return {
    name: hostel.name,
    type: hostel.type,
    university: hostel.university,
    year_established: hostel.year_established,
    directions: location.directions,
    distance_to_campus_in_minutes: location.distance_to_campus_in_minutes,
    latitude: location.latitude,
    longitude: location.longitude,
    manager_name: contact.manager_name,
    phone: contact.phone,
    whatsapp: contact.whatsapp,
    email: contact.email,
    office_hours: contact.office_hours,
    website: contact.website,
    price_min: price.price_min,
    price_max: price.price_max,
    billing_period: price.billing_period,
    installment_allowed: price.installment_allowed,
    utilities_fee: price.utilities_fee,
    maintenance_fee: price.maintenance_fee,
    caution_deposit: price.caution_deposit,
    refund_policy: price.refund_policy,
    rooms: rooms.map((r) => ({ type: r.room_type, price: r.price })),
    perks: furnishing.map((f) => f.furnishing),
    rules: rules.map((r) => r.rule),
  };
}

/** Only the fields that actually differ, with their before and after values. */
function buildDiff(changes, live) {
  const diff = [];
  for (const [key, next] of Object.entries(changes)) {
    const before = live[key];
    const beforeText = displayValue(before);
    const afterText = displayValue(next);
    if (beforeText === afterText) continue;
    diff.push({
      field: key,
      label: FIELD_LABELS[key] || key.replace(/_/g, ' '),
      before: beforeText,
      after: afterText,
    });
  }
  return diff;
}

exports.listUpdateRequests = async (req, res) => {
  try {
    const status = str(req.query.status) || 'pending';
    const where = [];
    const params = [];

    if (status !== 'all') {
      where.push('r.status = ?');
      params.push(status);
    }
    if (req.teamUser.role !== 'super_admin') {
      where.push('r.requested_by = ?');
      params.push(req.teamUser.id);
    }

    const [rows] = await db.query(
      `SELECT
         r.id, r.hostel_id, r.reason, r.status, r.decision_note,
         r.created_at, r.reviewed_at, r.pending_changes,
         (r.pending_changes IS NOT NULL) AS has_staged_changes,
         h.name AS hostel_name, h.main_image, h.status AS hostel_status,
         u.full_name AS requested_by_name, u.email AS requested_by_email,
         rv.full_name AS reviewed_by_name
       FROM hostel_update_requests r
       JOIN hostels h ON h.hostel_id = r.hostel_id
       LEFT JOIN team_users u ON u.id = r.requested_by
       LEFT JOIN team_users rv ON rv.id = r.reviewed_by
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY r.created_at DESC, r.id DESC`,
      params
    );

    // Resolve the staged edits into a readable before/after list. Only the rows
    // that actually have changes need the extra queries.
    const requests = await Promise.all(
      rows.map(async (row) => {
        const changes = parseChanges(row.pending_changes);
        let diff = [];
        if (changes) {
          try {
            diff = buildDiff(changes, await loadLiveValues(row.hostel_id));
          } catch (err) {
            console.error('buildDiff error:', err);
          }
        }
        const { pending_changes: _omit, ...rest } = row;
        return {
          ...rest,
          has_staged_changes: Boolean(row.has_staged_changes),
          staged_diff: diff,
        };
      })
    );

    res.json({ requests });
  } catch (err) {
    console.error('listUpdateRequests error:', err);
    res.status(500).json({ message: 'Failed to load update requests' });
  }
};

/**
 * GET /api/team/hostels/:id/update-request
 * The latest request for a hostel, so the sub admin app knows whether the edit
 * form is unlocked. Returns `{ request: null }` when there has never been one.
 */
exports.getHostelUpdateRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const [hostelRows] = await db.query(
      'SELECT hostel_id, created_by FROM hostels WHERE hostel_id = ?',
      [id]
    );
    const hostel = hostelRows[0];
    if (!hostel) return res.status(404).json({ message: 'Hostel not found' });

    const [rows] = await db.query(
      `SELECT r.id, r.hostel_id, r.reason, r.status, r.decision_note,
              r.created_at, r.reviewed_at, rv.full_name AS reviewed_by_name
       FROM hostel_update_requests r
       LEFT JOIN team_users rv ON rv.id = r.reviewed_by
       WHERE r.hostel_id = ?
       ORDER BY r.created_at DESC, r.id DESC
       LIMIT 1`,
      [id]
    );

    res.json({ request: rows[0] || null });
  } catch (err) {
    console.error('getHostelUpdateRequest error:', err);
    res.status(500).json({ message: 'Failed to load the update request' });
  }
};

/** PATCH /api/team/hostels/update-requests/:requestId/approve  (super_admin) */
exports.approveUpdateRequest = (req, res) => decideUpdateRequest(req, res, 'approved');
/** PATCH /api/team/hostels/update-requests/:requestId/reject   (super_admin) body: { reason } */
exports.rejectUpdateRequest = (req, res) => decideUpdateRequest(req, res, 'rejected');

async function decideUpdateRequest(req, res, action) {
  const conn = await db.getConnection();
  try {
    const { requestId } = req.params;
    const note = str(req.body?.reason || req.body?.note);

    if (action === 'rejected' && !note) {
      return res.status(400).json({ message: 'A reason for the rejection is required' });
    }

    await conn.beginTransaction();

    const [rows] = await conn.query(
      `SELECT id, hostel_id, status FROM hostel_update_requests
       WHERE id = ? FOR UPDATE`,
      [requestId]
    );
    const request = rows[0];
    if (!request) {
      await conn.rollback();
      return res.status(404).json({ message: 'Update request not found' });
    }
    if (request.status !== 'pending') {
      await conn.rollback();
      return res.status(409).json({ message: `This request was already ${request.status}` });
    }

    await conn.query(
      `UPDATE hostel_update_requests
         SET status = ?, decision_note = ?, reviewed_by = ?, reviewed_at = NOW()
       WHERE id = ?`,
      [action, note, req.teamUser.id, requestId]
    );

    await conn.query(
      `INSERT INTO hostel_review_log (hostel_id, action, performed_by, note)
       VALUES (?, ?, ?, ?)`,
      [
        request.hostel_id,
        action === 'approved' ? 'update_approved' : 'update_rejected',
        req.teamUser.id,
        note,
      ]
    );

    await conn.commit();

    res.json({
      message: action === 'approved' ? 'Update request approved' : 'Update request rejected',
      request: { id: Number(requestId), hostel_id: request.hostel_id, status: action },
    });
  } catch (err) {
    try {
      await conn.rollback();
    } catch {
      /* rollback is best effort */
    }
    console.error(`decideUpdateRequest(${action}) error:`, err);
    res.status(500).json({ message: `Failed to ${action} the update request` });
  } finally {
    conn.release();
  }
}

/* ----------------------------- staged hostel edits -------------------------- */

/**
 * A sub admin edits a hostel only through an approved update request.
 *
 * Flow:
 *   1. request approved            -> the edit form unlocks
 *   2. PUT  .../changes            -> edits stored as JSON, NOT live yet
 *   3. super admin approves/rejects-> edits applied to the live tables or dropped
 */

/**
 * The open, approved request that grants this user permission to edit a hostel.
 * After a change set is applied, the request is marked 'rejected' so the
 * permission is spent and a fresh request is needed.
 */
async function findEditableRequest(hostelId, userId) {
  const [rows] = await db.query(
    `SELECT * FROM hostel_update_requests
     WHERE hostel_id = ? AND requested_by = ? AND status = 'approved'
     ORDER BY created_at DESC, id DESC LIMIT 1`,
    [hostelId, userId]
  );
  return rows[0] || null;
}

/** MySQL may hand back JSON as a string depending on the driver's type parsing. */
function parseChanges(value) {
  if (!value) return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value;
}

/**
 * Accepts the fields the edit form is allowed to touch. Anything the form can
 * echo back but the sub admin cannot change (status, ids, review fields) is
 * ignored, so a crafted payload cannot promote a hostel or reassign it.
 */
function sanitizeChanges(body) {
  const src = body?.changes ?? body ?? {};
  const out = {};

  const scalar = {
    name: (v) => str(v),
    type: (v) => str(v),
    university: (v) => str(v),
    year_established: (v) => num(v),
    directions: (v) => str(v),
    distance_to_campus_in_minutes: (v) => num(v),
    latitude: (v) => num(v),
    longitude: (v) => num(v),
    manager_name: (v) => str(v),
    phone: (v) => str(v),
    whatsapp: (v) => str(v),
    email: (v) => str(v),
    office_hours: (v) => str(v),
    website: (v) => str(v),
    price_min: (v) => num(v),
    price_max: (v) => num(v),
    billing_period: (v) => str(v),
    installment_allowed: (v) => bool(v),
    utilities_fee: (v) => num(v),
    maintenance_fee: (v) => num(v),
    caution_deposit: (v) => num(v),
    refund_policy: (v) => str(v),
  };
  for (const [key, cast] of Object.entries(scalar)) {
    if (Object.prototype.hasOwnProperty.call(src, key)) out[key] = cast(src[key]);
  }

  if (Object.prototype.hasOwnProperty.call(src, 'rooms')) {
    out.rooms = parseRoomTypes(src.rooms);
  }
  if (Object.prototype.hasOwnProperty.call(src, 'perks')) {
    out.perks = parseList(src.perks);
  }
  if (Object.prototype.hasOwnProperty.call(src, 'rules')) {
    out.rules = parseList(src.rules);
  }

  return out;
}

function isEmptyChanges(changes) {
  return Object.keys(changes).length === 0;
}

/** What the sub admin may edit, prefilled with the live values. */
exports.getHostelChanges = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await findEditableRequest(id, req.teamUser.id);
    if (!request) {
      return res
        .status(403)
        .json({ message: 'You do not have an approved update request for this hostel' });
    }

    const [[locations], [contacts], [rooms], [amenities], [furnishing], [rules], [pricing]] =
      await Promise.all([
        db.query('SELECT * FROM locations WHERE hostel_id = ? LIMIT 1', [id]),
        db.query('SELECT * FROM contact WHERE hostel_id = ? LIMIT 1', [id]),
        db.query("SELECT room_type, price FROM rooms WHERE hostel_id = ? ORDER BY room_id", [id]),
        db.query('SELECT amenity FROM amenities WHERE hostel_id = ?', [id]),
        db.query('SELECT furnishing FROM furnishing WHERE hostel_id = ?', [id]),
        db.query('SELECT rule FROM rules WHERE hostel_id = ?', [id]),
        db.query('SELECT * FROM pricing WHERE hostel_id = ? LIMIT 1', [id]),
      ]);

    const [hostelRows] = await db.query(
      `SELECT hostel_id, name, type, university, year_established, main_image, status
       FROM hostels WHERE hostel_id = ?`,
      [id]
    );
    if (!hostelRows.length) return res.status(404).json({ message: 'Hostel not found' });

    // Furnishing holds the full perk list; amenities is the card subset.
    const perks = furnishing.map((f) => f.furnishing);

    res.json({
      hostel: hostelRows[0],
      request_id: request.id,
      request_reason: request.reason,
      staged: parseChanges(request.pending_changes),
      values: {
        name: hostelRows[0].name,
        type: hostelRows[0].type,
        university: hostelRows[0].university,
        year_established: hostelRows[0].year_established,
        ...(locations[0] || {}),
        ...(contacts[0] || {}),
        ...(pricing[0] || {}),
        rooms: rooms.map((r) => ({ type: r.room_type, price: r.price })),
        perks,
        rules: rules.map((r) => r.rule),
        amenities_count: amenities.length,
      },
    });
  } catch (err) {
    console.error('getHostelChanges error:', err);
    res.status(500).json({ message: 'Failed to load the editable hostel' });
  }
};

/** Stages the edits. Nothing is written to the live tables until approval. */
exports.stageHostelChanges = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await findEditableRequest(id, req.teamUser.id);
    if (!request) {
      return res
        .status(403)
        .json({ message: 'You do not have an approved update request for this hostel' });
    }
    if (request.pending_changes) {
      return res
        .status(409)
        .json({ message: 'Your changes are already awaiting super admin review' });
    }

    const changes = sanitizeChanges(req.body);
    if (isEmptyChanges(changes)) {
      return res.status(400).json({ message: 'No changes were provided' });
    }
    if (changes.name === '') {
      return res.status(400).json({ message: 'The hostel name cannot be empty' });
    }

    await db.query(
      'UPDATE hostel_update_requests SET pending_changes = ? WHERE id = ?',
      [JSON.stringify(changes), request.id]
    );

    await db.query(
      `INSERT INTO hostel_review_log (hostel_id, action, performed_by, note)
       VALUES (?, 'update_submitted', ?, ?)`,
      [id, req.teamUser.id, `Edits staged: ${Object.keys(changes).join(', ')}`]
    );

    res.json({
      message: 'Your changes were sent for review',
      request: { id: request.id, hostel_id: id, staged: changes },
    });
  } catch (err) {
    console.error('stageHostelChanges error:', err);
    res.status(500).json({ message: 'Failed to save your changes' });
  }
};

/** Applies a staged change set to the live tables. Runs inside a transaction. */
async function applyChanges(conn, hostelId, changes) {
  const applied = [];

  // hostels: only the columns the form owns.
  const hostelCols = ['name', 'type', 'university', 'year_established'];
  const hostelSets = [];
  const hostelVals = [];
  for (const col of hostelCols) {
    if (Object.prototype.hasOwnProperty.call(changes, col)) {
      hostelSets.push(`${col} = ?`);
      hostelVals.push(changes[col]);
      applied.push(`hostels.${col}`);
    }
  }
  if (hostelSets.length) {
    await conn.query(
      `UPDATE hostels SET ${hostelSets.join(', ')} WHERE hostel_id = ?`,
      [...hostelVals, hostelId]
    );
  }

  // locations
  const locCols = ['directions', 'distance_to_campus_in_minutes', 'latitude', 'longitude'];
  const locSets = [];
  const locVals = [];
  for (const col of locCols) {
    if (Object.prototype.hasOwnProperty.call(changes, col)) {
      locSets.push(`${col} = ?`);
      locVals.push(changes[col]);
      applied.push(`locations.${col}`);
    }
  }
  if (locSets.length) {
    const [existing] = await conn.query('SELECT location_id FROM locations WHERE hostel_id = ? LIMIT 1', [hostelId]);
    if (existing.length) {
      await conn.query(
        `UPDATE locations SET ${locSets.join(', ')} WHERE hostel_id = ?`,
        [...locVals, hostelId]
      );
    } else {
      const cols = locCols.filter((c) => Object.prototype.hasOwnProperty.call(changes, c));
      await conn.query(
        `INSERT INTO locations (hostel_id, ${cols.join(', ')}) VALUES (?, ${cols.map(() => '?').join(', ')})`,
        [hostelId, ...cols.map((c) => changes[c])]
      );
    }
  }

  // contact
  const contactCols = ['manager_name', 'phone', 'whatsapp', 'email', 'office_hours', 'website'];
  const contactSets = [];
  const contactVals = [];
  for (const col of contactCols) {
    if (Object.prototype.hasOwnProperty.call(changes, col)) {
      contactSets.push(`${col} = ?`);
      contactVals.push(changes[col]);
      applied.push(`contact.${col}`);
    }
  }
  if (contactSets.length) {
    const [existing] = await conn.query('SELECT contact_id FROM contact WHERE hostel_id = ? LIMIT 1', [hostelId]);
    if (existing.length) {
      await conn.query(
        `UPDATE contact SET ${contactSets.join(', ')} WHERE hostel_id = ?`,
        [...contactVals, hostelId]
      );
    } else {
      const cols = contactCols.filter((c) => Object.prototype.hasOwnProperty.call(changes, c));
      await conn.query(
        `INSERT INTO contact (hostel_id, ${cols.join(', ')}) VALUES (?, ${cols.map(() => '?').join(', ')})`,
        [hostelId, ...cols.map((c) => changes[c])]
      );
    }
  }

  // pricing
  const pricingCols = [
    'price_min', 'price_max', 'billing_period', 'installment_allowed',
    'utilities_fee', 'maintenance_fee', 'caution_deposit', 'refund_policy',
  ];
  const pricingSets = [];
  const pricingVals = [];
  for (const col of pricingCols) {
    if (Object.prototype.hasOwnProperty.call(changes, col)) {
      pricingSets.push(`${col} = ?`);
      pricingVals.push(changes[col]);
      applied.push(`pricing.${col}`);
    }
  }
  if (pricingSets.length) {
    const [existing] = await conn.query('SELECT pricing_id FROM pricing WHERE hostel_id = ? LIMIT 1', [hostelId]);
    if (existing.length) {
      await conn.query(
        `UPDATE pricing SET ${pricingSets.join(', ')} WHERE hostel_id = ?`,
        [...pricingVals, hostelId]
      );
    } else {
      const cols = pricingCols.filter((c) => Object.prototype.hasOwnProperty.call(changes, c));
      await conn.query(
        `INSERT INTO pricing (hostel_id, ${cols.join(', ')}) VALUES (?, ${cols.map(() => '?').join(', ')})`,
        [hostelId, ...cols.map((c) => changes[c])]
      );
    }
  }

  // rooms: replaced wholesale when the form sends a room list.
  if (Object.prototype.hasOwnProperty.call(changes, 'rooms')) {
    await conn.query('DELETE FROM rooms WHERE hostel_id = ?', [hostelId]);
    for (const room of changes.rooms) {
      await conn.query(
        'INSERT INTO rooms (hostel_id, room_type, price, available_rooms) VALUES (?, ?, ?, ?)',
        [hostelId, room.type, room.price, null]
      );
    }
    applied.push(`rooms (${changes.rooms.length})`);
  }

  // perks are mirrored into amenities (card subset) and furnishing (full list).
  if (Object.prototype.hasOwnProperty.call(changes, 'perks')) {
    const { card, all } = splitPerks(changes.perks);
    await conn.query('DELETE FROM amenities WHERE hostel_id = ?', [hostelId]);
    await conn.query('DELETE FROM furnishing WHERE hostel_id = ?', [hostelId]);
    for (const amenity of card) {
      await conn.query('INSERT INTO amenities (hostel_id, amenity) VALUES (?, ?)', [hostelId, amenity]);
    }
    for (const item of all) {
      await conn.query('INSERT INTO furnishing (hostel_id, furnishing) VALUES (?, ?)', [hostelId, item]);
    }
    applied.push(`perks (${all.length}, ${card.length} on card)`);
  }

  if (Object.prototype.hasOwnProperty.call(changes, 'rules')) {
    await conn.query('DELETE FROM rules WHERE hostel_id = ?', [hostelId]);
    for (const rule of changes.rules) {
      await conn.query('INSERT INTO rules (hostel_id, rule) VALUES (?, ?)', [hostelId, rule]);
    }
    applied.push(`rules (${changes.rules.length})`);
  }

  return applied;
}

/** PATCH .../update-requests/:requestId/changes/approve  (super_admin) */
exports.approveStagedChanges = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { requestId } = req.params;

    await conn.beginTransaction();

    const [rows] = await conn.query(
      'SELECT * FROM hostel_update_requests WHERE id = ? FOR UPDATE',
      [requestId]
    );
    const request = rows[0];
    if (!request) {
      await conn.rollback();
      return res.status(404).json({ message: 'Update request not found' });
    }

    const changes = parseChanges(request.pending_changes);
    if (!changes) {
      await conn.rollback();
      return res.status(409).json({ message: 'There are no staged changes to approve' });
    }

    const applied = await applyChanges(conn, request.hostel_id, changes);

    // Applying consumes the permission: the request is closed and cleared, so
    // the sub admin must request again before making further edits.
    await conn.query(
      `UPDATE hostel_update_requests
         SET status = 'rejected', pending_changes = NULL,
             decision_note = ?, reviewed_by = ?, reviewed_at = NOW()
       WHERE id = ?`,
      ['Edits applied', req.teamUser.id, requestId]
    );

    await conn.query(
      `INSERT INTO hostel_review_log (hostel_id, action, performed_by, note)
       VALUES (?, 'change_approved', ?, ?)`,
      [request.hostel_id, req.teamUser.id, `Applied: ${applied.join(', ') || 'no fields'}`]
    );

    await conn.commit();

    res.json({
      message: 'Edits applied to the live hostel',
      request: { id: Number(requestId), hostel_id: request.hostel_id, status: 'rejected' },
      applied,
    });
  } catch (err) {
    try {
      await conn.rollback();
    } catch {
      /* rollback is best effort */
    }
    console.error('approveStagedChanges error:', err);
    res.status(500).json({ message: 'Failed to apply the changes' });
  } finally {
    conn.release();
  }
};

/** PATCH .../update-requests/:requestId/changes/reject  (super_admin) body: { reason } */
exports.rejectStagedChanges = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { requestId } = req.params;
    const reason = str(req.body?.reason);
    if (!reason) return res.status(400).json({ message: 'A rejection reason is required' });

    await conn.beginTransaction();

    const [rows] = await conn.query(
      'SELECT * FROM hostel_update_requests WHERE id = ? FOR UPDATE',
      [requestId]
    );
    const request = rows[0];
    if (!request) {
      await conn.rollback();
      return res.status(404).json({ message: 'Update request not found' });
    }
    if (!parseChanges(request.pending_changes)) {
      await conn.rollback();
      return res.status(409).json({ message: 'There are no staged changes to reject' });
    }

    // Dropping the changes also closes the request, so the permission is spent
    // and the hostel keeps its current live values.
    await conn.query(
      `UPDATE hostel_update_requests
         SET status = 'rejected', pending_changes = NULL,
             decision_note = ?, reviewed_by = ?, reviewed_at = NOW()
       WHERE id = ?`,
      [reason, req.teamUser.id, requestId]
    );

    await conn.query(
      `INSERT INTO hostel_review_log (hostel_id, action, performed_by, note)
       VALUES (?, 'change_rejected', ?, ?)`,
      [request.hostel_id, req.teamUser.id, reason]
    );

    await conn.commit();

    res.json({
      message: 'Changes rejected; the hostel was left unchanged',
      request: { id: Number(requestId), hostel_id: request.hostel_id, status: 'rejected' },
    });
  } catch (err) {
    try {
      await conn.rollback();
    } catch {
      /* rollback is best effort */
    }
    console.error('rejectStagedChanges error:', err);
    res.status(500).json({ message: 'Failed to reject the changes' });
  } finally {
    conn.release();
  }
};

/* ---------------------------------- counters --------------------------------- */

/** GET /api/team/hostels/stats  — dashboard counters. */
exports.getStats = async (req, res) => {
  try {
    const isSuperAdmin = req.teamUser.role === 'super_admin';

    const [rows] = await db.query(
      `SELECT status, COUNT(*) AS total FROM hostels ${isSuperAdmin ? '' : 'WHERE created_by = ?'} GROUP BY status`,
      isSuperAdmin ? [] : [req.teamUser.id]
    );

    const stats = { pending: 0, approved: 0, rejected: 0, total: 0 };
    for (const row of rows) {
      stats[row.status] = Number(row.total);
      stats.total += Number(row.total);
    }

    // Update requests still awaiting a decision. A sub admin counts only the
    // ones they raised; a super admin counts everything in their queue.
    const [requestRows] = await db.query(
      `SELECT COUNT(*) AS total FROM hostel_update_requests
       WHERE status = 'pending'${isSuperAdmin ? '' : ' AND requested_by = ?'}`,
      isSuperAdmin ? [] : [req.teamUser.id]
    );
    stats.update_pending = Number(requestRows[0]?.total ?? 0);
    // What the app shows as "Pending": new submissions plus requested updates.
    stats.pending_total = stats.pending + stats.update_pending;

    res.json({ stats });
  } catch (err) {
    console.error('getStats error:', err);
    res.status(500).json({ message: 'Failed to load stats' });
  }
};
