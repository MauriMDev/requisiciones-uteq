// ===== ARCHIVO: src/routes/comprasRoutes.js =====
const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const processFormData = require('../middleware/processFormData');

const router = express.Router();

// Exportar las funciones del controlador (asegúrate de importarlas)
const {
  crearCompra,
  obtenerCompras,
  obtenerCompraPorId,
  actualizarCompra,
  agregarFactura,
  actualizarEstadoFactura
} = require('../controllers/comprasController');

router.use(protect);

// Rutas principales
router
  .route('/')
  .get(authorize('administrativo', 'admin_sistema'), obtenerCompras)
  .post(
    upload.array('archivos', 5),
    processFormData,
    authorize('administrativo', 'admin_sistema'),
    crearCompra
  );

// Rutas por ID
router
  .route('/:id')
  .get(authorize('administrativo', 'admin_sistema'), obtenerCompraPorId)
  .put(
    upload.array('archivos', 5),
    processFormData,
    authorize('administrativo', 'admin_sistema'),
    actualizarCompra
  );

// Ruta para agregar factura
router.post('/:id/facturas', 
  authorize('administrativo', 'admin_sistema'),
  agregarFactura
);

// Ruta para actualizar estado de factura
router.patch('/:id/facturas/:facturaId/estado', 
  authorize('administrativo', 'admin_sistema'),
  actualizarEstadoFactura
);


module.exports = router;