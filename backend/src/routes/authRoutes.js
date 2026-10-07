const express = require('express');
const rateLimit = require('express-rate-limit');
const { login, me, changePassword } = require('../controllers/authController');
const { verifyTeamToken } = require('../middleware/teamAuth');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many attempts. Try again later.' },
});

const passwordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many attempts. Try again later.' },
});

router.post('/login', loginLimiter, login);
router.get('/me', verifyTeamToken, me);
router.post('/change-password', verifyTeamToken, passwordLimiter, changePassword);

module.exports = router;