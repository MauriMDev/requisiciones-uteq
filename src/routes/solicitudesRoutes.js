const express = require('express')
const upload = require('../middleware/uploadMiddleware') // ← Cambio aquí
const processFormData = require('../middleware/processFormData')
const {
  crearSolicitud,
  obtenerSolicitudes,
  obtenerSolicitudPorId,
  actualizarSolicitud,
  aprobarSolicitud,
  cancelarSolicitud,
  eliminarSolicitud,
  obtenerEstadisticas,
  descargarArchivo,
} = require('../controllers/solicitudesController')
const { protect, authorize } = require('../middleware/authMiddleware')

const router = express.Router()

// Todas las rutas requieren autenticación
router.use(protect)

// Rutas específicas ANTES de las rutas parametrizadas
router.get(
  '/estadisticas',
  authorize('admin_sistema', 'administrativo', 'aprobador'),
  obtenerEstadisticas
)

// Ruta para obtener mis solicitudes (solicitante)
router.get(
  '/mis-solicitudes',
  authorize('solicitante'),
  (req, res, next) => {
    // Agregar filtro automático por usuario
    req.query.solicitante_id = req.user.id_usuario
    next()
  },
  obtenerSolicitudes
)

// Ruta para descargar archivos
router.get('/:id/archivos/:nombreArchivo', descargarArchivo)

// Rutas principales
router.route('/').get(obtenerSolicitudes).post( //creacion de solicitud y subida de archivos
  upload.array('files', 5), // Procesar hasta 5 archivos
  processFormData, // Procesar FormData
  authorize('solicitante', 'admin_sistema'),
  crearSolicitud
)

// Rutas por ID
router
  .route('/:id')
  .get(obtenerSolicitudPorId)
  .put(
    upload.multiple('files', 5), // ← Cambio aquí: .multiple()
    processFormData,
    authorize('solicitante', 'admin_sistema'),
    actualizarSolicitud
  )
  .delete(
    authorize('solicitante', 'admin_sistema', 'administrativo'),
    eliminarSolicitud
  )

// Ruta para aprobar solicitud
router.patch(
  '/:id/aprobar',
  authorize('admin_sistema', 'administrativo', 'aprobador'),
  aprobarSolicitud
)

// Ruta para cancelar solicitud
router.patch(
  '/:id/cancelar',
  authorize('solicitante', 'admin_sistema', 'administrativo'),
  cancelarSolicitud
)

module.exports = router