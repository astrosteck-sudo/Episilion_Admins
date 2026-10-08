const express = require('express');
const { createSubAdmin, listSubAdmins } = require('../controllers/subAdminController');
const { requireRole, verifyTeamToken } = require('../middleware/teamAuth');

const router = express.Router();

router.use(verifyTeamToken, requireRole('super_admin'));

router.get('/', listSubAdmins);
router.post('/', createSubAdmin);

module.exports = router;
