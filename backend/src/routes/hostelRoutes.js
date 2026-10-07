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
  createUpdateRequest,
  listUpdateCandidates,
  listUpdateRequests,
  getHostelUpdateRequest,
  approveUpdateRequest,
  rejectUpdateRequest,
  getHostelChanges,
  stageHostelChanges,
  approveStagedChanges,
  rejectStagedChanges,
} = require('../controllers/hostelController');

const router = express.Router();

router.use(verifyTeamToken);

// Sub-admins submit new hostels (multipart/form-data, up to 6 `photos`).
router.post('/', requireRole('sub_admin', 'super_admin'), upload.array('photos', 6), createHostel);

// Counters must be declared before the `/:id` route so it is not swallowed.
router.get('/stats', getStats);

// Update requests. These literal paths must also precede `/:id`.
router.get('/update-candidates', listUpdateCandidates);
router.get('/update-requests', listUpdateRequests);
router.patch('/update-requests/:requestId/approve', requireRole('super_admin'), approveUpdateRequest);
router.patch('/update-requests/:requestId/reject', requireRole('super_admin'), rejectUpdateRequest);

// Staged edits. These must also precede `/:id`, otherwise `update-requests`
// would be read as a hostel id.
router.patch(
  '/update-requests/:requestId/changes/approve',
  requireRole('super_admin'),
  approveStagedChanges
);
router.patch(
  '/update-requests/:requestId/changes/reject',
  requireRole('super_admin'),
  rejectStagedChanges
);

router.get('/', listHostels);
router.get('/:id', getHostel);
router.get('/:id/update-request', getHostelUpdateRequest);
router.post('/:id/update-requests', requireRole('sub_admin', 'super_admin'), createUpdateRequest);

// The edit form: read the live values, then stage changes for review.
router.get('/:id/changes', requireRole('sub_admin', 'super_admin'), getHostelChanges);
router.put('/:id/changes', requireRole('sub_admin', 'super_admin'), stageHostelChanges);

router.patch('/:id/approve', requireRole('super_admin'), approveHostel);
router.patch('/:id/reject', requireRole('super_admin'), rejectHostel);

module.exports = router;
