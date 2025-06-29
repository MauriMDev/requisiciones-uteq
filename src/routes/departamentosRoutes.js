// ===== ARCHIVO: src/routes/departamentosRoutes.js =====
const express = require('express')
const { protect, authorize } = require('../middleware/authMiddleware')

const router = express.Router()

router.use(protect)

router.get('/', (req, res) => {
  res.json({ message: 'Ruta de departamentos - pendiente implementación' })
})

module.exports = router