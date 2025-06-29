// ===== ARCHIVO: src/routes/aprobacionesRoutes.js =====
const express = require('express')
const { protect, authorize } = require('../middleware/authMiddleware')

const router = express.Router()

router.use(protect)

router.get('/', authorize('aprobador', 'admin_sistema'), (req, res) => {
  res.json({ message: 'Ruta de aprobaciones - pendiente implementación' })
})

module.exports = router