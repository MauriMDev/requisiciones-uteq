// ===== ARCHIVO: src/routes/authRoutes.js =====
const express = require('express')
const { login, getMe, logout } = require('../controllers/authController')
const { protect } = require('../middleware/authMiddleware')

const router = express.Router()

// Rutas públicas - SOLO LOGIN
router.post('/login', login)

// Rutas protegidas
router.get('/me', protect, getMe)
router.post('/logout', protect, logout)

module.exports = router