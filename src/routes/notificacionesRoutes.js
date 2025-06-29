// ===== ARCHIVO: src/routes/notificacionesRoutes.js =====
const express = require('express')
const { protect } = require('../middleware/authMiddleware')

const router = express.Router()

router.use(protect)

router.get('/', (req, res) => {
  res.json({ message: 'Ruta de notificaciones - pendiente implementación' })
})

module.exports = router