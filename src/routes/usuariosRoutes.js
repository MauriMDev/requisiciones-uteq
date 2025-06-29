// ===== ARCHIVO: src/routes/usuariosRoutes.js =====
const express = require('express')
const { protect, authorize } = require('../middleware/authMiddleware')
const { validateUsuario, validateId } = require('../middleware/validationMiddleware')

const router = express.Router()

// Todas las rutas requieren autenticación
router.use(protect)

// Placeholder para controladores de usuarios
router.get('/', authorize('admin_sistema', 'administrativo'), (req, res) => {
  res.json({ message: 'Ruta de usuarios - pendiente implementación' })
})

router.post('/', authorize('admin_sistema'), validateUsuario, (req, res) => {
  res.json({ message: 'Crear usuario - pendiente implementación' })
})

module.exports = router
