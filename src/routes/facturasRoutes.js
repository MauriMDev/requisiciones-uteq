
// ===== ARCHIVO: src/routes/facturasRoutes.js =====
const express = require('express')
const { protect, authorize } = require('../middleware/authMiddleware')

const router = express.Router()

router.use(protect)

router.get('/', authorize('administrativo', 'admin_sistema'), (req, res) => {
  res.json({ message: 'Ruta de facturas - pendiente implementación' })
})

module.exports = router