// ===== ARCHIVO: src/routes/solicitudesRoutes.js =====
const express = require('express')
const {
  getSolicitudes,
  getSolicitud,
  createSolicitud,
  updateSolicitud,
  deleteSolicitud
} = require('../controllers/solicitudesController')
const { protect, authorize } = require('../middleware/authMiddleware')
const { validateSolicitud, validateId, validatePagination } = require('../middleware/validationMiddleware')

const router = express.Router()

// Todas las rutas requieren autenticación
router.use(protect)

router.route('/')
  .get(validatePagination, getSolicitudes)
  .post(validateSolicitud, createSolicitud)

router.route('/:id')
  .get(validateId, getSolicitud)
  .put(validateId, updateSolicitud)
  .delete(validateId, deleteSolicitud)

module.exports = router