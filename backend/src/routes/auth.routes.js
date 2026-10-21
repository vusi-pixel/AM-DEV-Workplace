'use strict';
const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const { loginSchema, changePasswordSchema } = require('../validators/auth.validators');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, validateBody(loginSchema), authController.login);
router.post('/logout', requireAuth, authController.logout);
router.get('/me', requireAuth, authController.me);
router.post('/change-password', requireAuth, validateBody(changePasswordSchema), authController.changePassword);

module.exports = router;
