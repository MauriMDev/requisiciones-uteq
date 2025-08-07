// routes/comprasRoutes.js
const express = require('express')
const { protect, authorize } = require('../middleware/authMiddleware')
const upload = require('../middleware/uploadMiddleware') // ← Sin cambios en import
const processFormData = require('../middleware/processFormData')

const router = express.Router()

const {
  crearCompra,
  obtenerCompras,
  obtenerCompraPorId,
  actualizarCompra,
  agregarFactura,
  actualizarEstadoFactura,
  eliminarCompra,
} = require('../controllers/comprasController')

router.use(protect)

// Rutas principales
router
  .route('/')
  .get(
    authorize('administrativo', 'admin_sistema', 'aprobador'),
    obtenerCompras
  )
  .post(
    upload.multiple('files', 5), // ← Cambio aquí: .multiple()
    processFormData,
    authorize('administrativo', 'admin_sistema', 'aprobador'),
    crearCompra
  )

// Rutas por ID
router
  .route('/:id')
  .get(
    authorize('administrativo', 'admin_sistema', 'aprobador'),
    obtenerCompraPorId
  )
  .put(
    upload.multiple('files', 5), // ← Cambio aquí: .multiple()
    processFormData,
    authorize('administrativo', 'admin_sistema', 'aprobador'),
    actualizarCompra
  )
  .delete(
    authorize('aprobador', 'admin_sistema', 'administrativo'),
    eliminarCompra
  )

// Ruta para agregar factura
router.post(
  '/:id/facturas',
  authorize('administrativo', 'admin_sistema', 'aprobador'),
  agregarFactura
)

// Ruta para actualizar estado de factura
router.patch(
  '/:id/facturas/:facturaId/estado',
  authorize('administrativo', 'admin_sistema', 'aprobador'),
  actualizarEstadoFactura
)

module.exports = router