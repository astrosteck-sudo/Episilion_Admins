const express = require('express');
const upload = require('../middleware/upload');
const { verifyTeamToken, requireRole } = require('../middleware/teamAuth');
const {
  createHostel,
  listHostels,
  getStats,
  getHostel,
  approveHostel,
  rejectHostel,
} = require('../controllers/hostelController');

const router = express.Router();

router.use(verifyTeamToken);

// Sub-admins submit new hostels (multipart/form-data, up to 6 `photos`).
router.post('/', requireRole('sub_admin', 'super_admin'), upload.array('photos', 6), createHostel);

// Counters must be declared before the `/:id` route so it is not swallowed.
router.get('/stats', getStats);
router.get('/', listHostels);
router.get('/:id', getHostel);

router.patch('/:id/approve', requireRole('super_admin'), approveHostel);
router.patch('/:id/reject', requireRole('super_admin'), rejectHostel);

module.exports = router;
