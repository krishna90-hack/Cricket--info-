/**
 * Auth Routes
 * /api/auth/*
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { registerValidation, loginValidation } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');

// Public routes
router.post('/register', authLimiter, registerValidation, authController.register);
router.post('/login',    authLimiter, loginValidation,    authController.login);
router.post('/logout',   authController.logout);

// Protected routes (require valid JWT)
router.get('/me',               protect, authController.getMe);
router.patch('/me',             protect, authController.updateMe);
router.patch('/change-password', protect, authController.changePassword);

module.exports = router;
