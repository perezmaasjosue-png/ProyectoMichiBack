const express = require('express');
const router = express.Router();
const { login, register, getMe } = require('../controllers/authController');
const { protect, autorizarRol } = require('../middleware/auth');

router.post('/login', login);
router.post('/register', protect, autorizarRol('admin'), register);
router.get('/me', protect, getMe);

module.exports = router;