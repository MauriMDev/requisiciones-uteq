

// ===== ARCHIVO: src/routes/cotizacionesRoutes.js =====
const express = require('express')
const { protect } = require('../middleware/authMiddleware')

const router = express.Router()

router.use(protect)

router.get('/', (req, res) => {
  res.json({ message: 'Ruta de cotizaciones - pendiente implementación' })
})

module.exports = router