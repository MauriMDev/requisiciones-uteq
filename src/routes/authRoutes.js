// ===== ARCHIVO: src/routes/authRoutes.js =====
const express = require('express')
const { register, login, getMe } = require('../controllers/authController')
const { protect, authorize } = require('../middleware/authMiddleware')
const { body } = require('express-validator')
const { handleValidationErrors } = require('../middleware/validationMiddleware')

const router = express.Router()

// Validaciones para registro
const registerValidation = [
  body('numero_empleado').notEmpty().withMessage('Número de empleado requerido'),
  body('nombre_completo').notEmpty().withMessage('Nombre completo requerido'),
  body('correo_institucional').isEmail().withMessage('Correo válido requerido'),
  body('departamento_id').isInt({ min: 1 }).withMessage('Departamento válido requerido'),
  body('password').isLength({ min: 6 }).withMessage('Contraseña mínimo 6 caracteres'),
  handleValidationErrors
]

// Validaciones para login
const loginValidation = [
  body('correo_institucional').isEmail().withMessage('Correo válido requerido'),
  body('password').notEmpty().withMessage('Contraseña requerida'),
  handleValidationErrors
]

// Rutas públicas
router.post('/login', loginValidation, login)

// Rutas protegidas
router.post('/register', protect, authorize('admin_sistema', 'administrativo'), registerValidation, register)
router.get('/me', protect, getMe)

module.exports = router