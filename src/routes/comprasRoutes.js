// ===== ARCHIVO: src/routes/comprasRoutes.js =====
const express = require('express')
const { protect, authorize } = require('../middleware/authMiddleware')
const upload = require('../middleware/uploadMiddleware')
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
  descargarArchivo, // ← NUEVA FUNCIÓN AGREGADA
} = require('../controllers/comprasController')

router.use(protect)

// Ruta para descargar archivos de compras
router.get('/:id/archivos/:nombreArchivo', 
  authorize('administrativo', 'admin_sistema', 'aprobador'),
  descargarArchivo
)

// Rutas principales
router
  .route('/')
  .get(
    authorize('administrativo', 'admin_sistema', 'aprobador'),
    obtenerCompras
  )
  .post(
    upload.array('files', 5),
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
    upload.array('files', 5),
    processFormData,
    authorize('administrativo', 'admin_sistema', 'aprobador'),
    actualizarCompra
  )
  .delete(
    authorize('aprobador', 'admin_sistema', 'administrativo'),
    eliminarCompra
  )

// Ruta para agregar factura (con subida de archivos)
router.post(
  '/:id/facturas',
  upload.array('files', 3), // Permitir subir archivos de factura
  processFormData,
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