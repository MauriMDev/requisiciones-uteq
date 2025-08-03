// src/routes/reportesRoutes.js
const express = require('express')
const router = express.Router()
const reportesController = require('../controllers/reportesController')
const { protect, authorize } = require('../middleware/authMiddleware')

// Importar middleware de validación
const {
  validateComprasParams,
  validateSolicitudesParams,
  validateRankingParams,
  validateEntregasParams,
  validateCuellosBotellaParams,
  validateDashboardParams,
  validateExportParams,
  validateMultipleDepartamentos,
  sanitizeParams,
  // rateLimitReportes,
  validateReferencedIds,
} = require('../middleware/reportesValidation')

// Middleware común para reportes (requiere autenticación)
const requireAuth = protect
const requireAdminOrApprover = authorize(
  'admin_sistema',
  'administrativo',
  'aprobador'
)
const requireAdminOnly = authorize('admin_sistema', 'administrativo')

// ===== REPORTES DE COMPRAS =====

/**
 * @route GET /api/reportes/compras/periodo
 * @desc Reporte de compras por período con análisis de tendencias
 * @access Administradores y Aprobadores
 * @params fecha_inicio, fecha_fin, departamento_id?, proveedor_id?, estatus?, periodo?
 */
router.get(
  '/compras/periodo',
  requireAuth,
  requireAdminOrApprover,
  sanitizeParams,
  validateComprasParams,
  validateReferencedIds,
  // rateLimitReportes,
  reportesController.getReporteComprasPeriodo
)

/**
 * @route GET /api/reportes/compras/departamentos
 * @desc Análisis de compras por departamento y centro de costo
 * @access Administradores y Aprobadores
 * @params fecha_inicio, fecha_fin, departamento_ids?
 */
router.get(
  '/compras/departamentos',
  requireAuth,
  requireAdminOrApprover,
  sanitizeParams,
  validateComprasParams,
  validateMultipleDepartamentos,
  validateReferencedIds,
  // rateLimitReportes,
  reportesController.getReporteComprasDepartamentos
)

/**
 * @route GET /api/reportes/compras (Mantener compatibilidad)
 * @desc Reporte básico de compras (redirige a periodo)
 * @access Administradores y Aprobadores
 */
router.get(
  '/compras',
  requireAuth,
  requireAdminOrApprover,
  sanitizeParams,
  validateComprasParams,
  validateReferencedIds,
  // rateLimitReportes,
  reportesController.getReporteCompras
)

// ===== REPORTES DE PROVEEDORES =====

/**
 * @route GET /api/reportes/proveedores/ranking
 * @desc Ranking de proveedores por volumen, frecuencia o calificación
 * @access Administradores y Aprobadores
 * @params fecha_inicio, fecha_fin, criterio?, limite?
 */
router.get(
  '/proveedores/ranking',
  requireAuth,
  requireAdminOrApprover,
  sanitizeParams,
  validateRankingParams,
  // rateLimitReportes,
  reportesController.getRankingProveedores
)

/**
 * @route GET /api/reportes/entregas/cumplimiento
 * @desc Análisis de cumplimiento de entregas por proveedor
 * @access Administradores y Aprobadores
 * @params fecha_inicio, fecha_fin, proveedor_id?
 */
router.get(
  '/entregas/cumplimiento',
  requireAuth,
  requireAdminOrApprover,
  sanitizeParams,
  validateEntregasParams,
  validateReferencedIds,
  // rateLimitReportes,
  reportesController.getCumplimientoEntregas
)

// ===== REPORTES DE SOLICITUDES =====

/**
 * @route GET /api/reportes/solicitudes/estatus
 * @desc Análisis de solicitudes por estatus y tiempo de aprobación
 * @access Administradores y Aprobadores
 * @params fecha_inicio, fecha_fin, estatus?, incluir_tiempos?
 */
router.get(
  '/solicitudes/estatus',
  requireAuth,
  requireAdminOrApprover,
  sanitizeParams,
  validateSolicitudesParams,
  validateReferencedIds,
  // rateLimitReportes,
  reportesController.getReporteSolicitudesEstatus
)

/**
 * @route GET /api/reportes/solicitudes (Mantener compatibilidad)
 * @desc Reporte básico de solicitudes (redirige a estatus)
 * @access Administradores y Aprobadores
 */
router.get(
  '/solicitudes',
  requireAuth,
  requireAdminOrApprover,
  sanitizeParams,
  validateSolicitudesParams,
  validateReferencedIds,
  // rateLimitReportes,
  reportesController.getReporteSolicitudes
)

/**
 * @route GET /api/reportes/solicitudes/cuellos-botella
 * @desc Identificación de cuellos de botella en el proceso de aprobación
 * @access Solo Administradores
 * @params fecha_inicio, fecha_fin, nivel_detalle?
 */
router.get(
  '/solicitudes/cuellos-botella',
  requireAuth,
  requireAdminOnly,
  sanitizeParams,
  validateCuellosBotellaParams,
  // rateLimitReportes,
  reportesController.getCuellosBottella
)

// ===== DASHBOARD EJECUTIVO =====

/**
 * @route GET /api/reportes/dashboard/ejecutivo
 * @desc Dashboard ejecutivo con KPIs principales y tendencias
 * @access Administradores y Aprobadores
 * @params periodo? (hoy, semana, mes, trimestre, año)
 */
router.get(
  '/dashboard/ejecutivo',
  requireAuth,
  requireAdminOrApprover,
  sanitizeParams,
  validateDashboardParams,
  reportesController.getDashboardEjecutivo
)

/**
 * @route GET /api/reportes/dashboard (Alias)
 * @desc Alias para dashboard ejecutivo
 * @access Administradores y Aprobadores
 */
router.get(
  '/dashboard',
  requireAuth,
  requireAdminOrApprover,
  sanitizeParams,
  validateDashboardParams,
  reportesController.getDashboardEjecutivo
)

// ===== EXPORTACIÓN DE REPORTES =====

/**
 * @route POST /api/reportes/exportar
 * @desc Exportación avanzada de reportes en múltiples formatos
 * @access Solo Administradores
 * @body tipo_reporte, formato, parametros, incluir_graficos?
 */
router.post(
  '/exportar',
  requireAuth,
  requireAdminOnly,
  sanitizeParams,
  validateExportParams,
  // rateLimitReportes,
  reportesController.exportarReporteAvanzado
)

/**
 * @route POST /api/reportes/exportar/basico (Mantener compatibilidad)
 * @desc Exportación básica de reportes (función original)
 * @access Solo Administradores
 */
router.post(
  '/exportar/basico',
  requireAuth,
  requireAdminOnly,
  sanitizeParams,
  // rateLimitReportes,
  reportesController.exportarReporte
)

// ===== REPORTES ADICIONALES (FUTUROS) =====

/**
 * @route GET /api/reportes/precios/variacion
 * @desc Análisis de variación de precios por producto/servicio
 * @access Administradores y Aprobadores
 * @params fecha_inicio, fecha_fin, proveedor_id?, categoria_producto?
 * @status PENDIENTE - No implementado aún
 */
router.get(
  '/precios/variacion',
  requireAuth,
  requireAdminOrApprover,
  (req, res) => {
    res.status(501).json({
      success: false,
      error: 'Funcionalidad en desarrollo',
      message:
        'El análisis de variación de precios estará disponible próximamente',
    })
  }
)

/**
 * @route GET /api/reportes/solicitudes/departamentos
 * @desc Análisis detallado de solicitudes por departamento
 * @access Administradores y Aprobadores
 * @params fecha_inicio, fecha_fin, departamento_ids?, tipo_requisicion?
 * @status PENDIENTE - No implementado aún
 */
router.get(
  '/solicitudes/departamentos',
  requireAuth,
  requireAdminOrApprover,
  (req, res) => {
    res.status(501).json({
      success: false,
      error: 'Funcionalidad en desarrollo',
      message: 'El análisis por departamentos estará disponible próximamente',
    })
  }
)

/**
 * @route GET /api/reportes/solicitudes/denegadas
 * @desc Análisis de solicitudes denegadas con motivos y patrones
 * @access Administradores y Aprobadores
 * @params fecha_inicio, fecha_fin, motivo_denegacion?
 * @status PENDIENTE - No implementado aún
 */
router.get(
  '/solicitudes/denegadas',
  requireAuth,
  requireAdminOrApprover,
  (req, res) => {
    res.status(501).json({
      success: false,
      error: 'Funcionalidad en desarrollo',
      message:
        'El análisis de solicitudes denegadas estará disponible próximamente',
    })
  }
)

/**
 * @route GET /api/reportes/solicitudes/seasonalidad
 * @desc Análisis de seasonalidad y patrones temporales de solicitudes
 * @access Administradores y Aprobadores
 * @params año, tipo_analisis?, departamento_id?
 * @status PENDIENTE - No implementado aún
 */
router.get(
  '/solicitudes/seasonalidad',
  requireAuth,
  requireAdminOrApprover,
  (req, res) => {
    res.status(501).json({
      success: false,
      error: 'Funcionalidad en desarrollo',
      message: 'El análisis de seasonalidad estará disponible próximamente',
    })
  }
)

// ===== FILTROS CONFIGURABLES =====

/**
 * @route GET /api/reportes/filtros/configurables
 * @desc Obtener filtros configurables disponibles para reportes
 * @access Todos los usuarios autenticados
 */
router.get('/filtros/configurables', requireAuth, async (req, res) => {
  try {
    const { Departamento, Proveedor, Usuario } = require('../models')

    // Obtener opciones para filtros
    const [departamentos, proveedores, usuarios] = await Promise.all([
      Departamento.findAll({
        where: { estatus: 'activo' },
        attributes: [
          'id_departamento',
          'nombre_departamento',
          'codigo_departamento',
        ],
        order: ['nombre_departamento'],
      }),
      Proveedor.findAll({
        where: { estatus: 'activo' },
        attributes: ['id_proveedor', 'nombre_proveedor', 'rfc'],
        order: ['nombre_proveedor'],
      }),
      Usuario.findAll({
        where: {
          estatus: 'activo',
          rol: ['aprobador', 'admin_sistema', 'administrativo'],
        },
        attributes: ['id_usuario', 'nombre_completo', 'rol'],
        order: ['nombre_completo'],
      }),
    ])

    res.json({
      success: true,
      data: {
        departamentos: departamentos.map((d) => ({
          id: d.id_departamento,
          nombre: d.nombre_departamento,
          codigo: d.codigo_departamento,
        })),
        proveedores: proveedores.map((p) => ({
          id: p.id_proveedor,
          nombre: p.nombre_proveedor,
          rfc: p.rfc,
        })),
        usuarios: usuarios.map((u) => ({
          id: u.id_usuario,
          nombre: u.nombre_completo,
          rol: u.rol,
        })),
        opciones_estatus: {
          solicitudes: [
            'pendiente',
            'en_revision',
            'aprobada',
            'denegada',
            'en_proceso',
            'completada',
          ],
          compras: ['ordenada', 'en_transito', 'entregada', 'cancelada'],
        },
        opciones_urgencia: ['baja', 'media', 'alta', 'critica'],
        opciones_tipo_requisicion: ['productos', 'servicios', 'mantenimiento'],
        opciones_periodo: ['hoy', 'semana', 'mes', 'trimestre', 'año'],
        opciones_criterio_ranking: ['volumen', 'frecuencia', 'calificacion'],
        formatos_exportacion: ['pdf', 'xlsx', 'csv'],
      },
    })
  } catch (error) {
    console.error('Error al obtener filtros configurables:', error)
    res.status(500).json({
      success: false,
      error: 'Error al obtener opciones de filtros',
      details: error.message,
    })
  }
})

/**
 * @route POST /api/reportes/filtros/guardar
 * @desc Guardar configuración de filtros personalizada del usuario
 * @access Todos los usuarios autenticados
 * @status FUTURO - Para implementar sistema de filtros guardados
 */
router.post('/filtros/guardar', requireAuth, (req, res) => {
  res.status(501).json({
    success: false,
    error: 'Funcionalidad en desarrollo',
    message:
      'El guardado de filtros personalizados estará disponible próximamente',
  })
})

// ===== REPORTES AUTOMÁTICOS =====

/**
 * @route POST /api/reportes/automaticos/configurar
 * @desc Configurar reportes automáticos por email
 * @access Solo Administradores
 * @status FUTURO - Para implementar sistema de reportes automáticos
 */
router.post(
  '/automaticos/configurar',
  requireAuth,
  requireAdminOnly,
  (req, res) => {
    res.status(501).json({
      success: false,
      error: 'Funcionalidad en desarrollo',
      message: 'Los reportes automáticos estarán disponibles próximamente',
    })
  }
)

/**
 * @route GET /api/reportes/automaticos/listar
 * @desc Listar reportes automáticos configurados
 * @access Solo Administradores
 * @status FUTURO
 */
router.get('/automaticos/listar', requireAuth, requireAdminOnly, (req, res) => {
  res.status(501).json({
    success: false,
    error: 'Funcionalidad en desarrollo',
    message:
      'La gestión de reportes automáticos estará disponible próximamente',
  })
})

// ===== VALIDACIÓN Y TESTING =====

/**
 * @route GET /api/reportes/health
 * @desc Verificar el estado del módulo de reportes
 * @access Todos los usuarios autenticados
 */
router.get('/health', requireAuth, async (req, res) => {
  try {
    const { sequelize } = require('../models')

    // Verificar conexión a la base de datos
    await sequelize.authenticate()

    // Obtener estadísticas básicas
    const { Solicitud, Compra } = require('../models')
    const [totalSolicitudes, totalCompras] = await Promise.all([
      Solicitud.count(),
      Compra.count(),
    ])

    res.json({
      success: true,
      status: 'healthy',
      data: {
        database_connection: 'ok',
        total_solicitudes: totalSolicitudes,
        total_compras: totalCompras,
        endpoints_disponibles: {
          compras: 4,
          solicitudes: 3,
          dashboard: 2,
          exportacion: 2,
          filtros: 1,
          total: 12,
        },
        endpoints_en_desarrollo: 6,
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Error en health check:', error)
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: 'Error en la verificación del sistema',
      details: error.message,
    })
  }
})

/**
 * @route GET /api/reportes/test/sample-data
 * @desc Generar datos de prueba para testing (solo en desarrollo)
 * @access Solo en modo desarrollo
 */
router.get('/test/sample-data', requireAuth, requireAdminOnly, (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      error: 'Esta funcionalidad solo está disponible en modo desarrollo',
    })
  }

  // Datos de ejemplo para testing
  const sampleData = {
    compras: [
      {
        numero_orden: 'ORD-2024-001',
        proveedor: 'Proveedor Ejemplo SA',
        departamento: 'Tecnología',
        fecha_compra: new Date(),
        monto_total: 15000.0,
        estatus: 'entregada',
      },
    ],
    solicitudes: [
      {
        folio_solicitud: 'SOL-2024-001',
        solicitante: 'Juan Pérez',
        departamento: 'Administración',
        fecha_creacion: new Date(),
        estatus: 'aprobada',
        tipo_requisicion: 'productos',
      },
    ],
    mensaje: 'Datos de ejemplo para testing. No son datos reales.',
  }

  res.json({
    success: true,
    data: sampleData,
  })
})

// ===== MIDDLEWARE DE ERROR PARA RUTAS NO ENCONTRADAS =====

/**
 * Middleware para manejar rutas de reportes no encontradas
 */
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint de reportes no encontrado',
    message: `La ruta ${req.originalUrl} no existe en el módulo de reportes`,
    endpoints_disponibles: [
      'GET /api/reportes/compras/periodo',
      'GET /api/reportes/compras/departamentos',
      'GET /api/reportes/proveedores/ranking',
      'GET /api/reportes/entregas/cumplimiento',
      'GET /api/reportes/solicitudes/estatus',
      'GET /api/reportes/solicitudes/cuellos-botella',
      'GET /api/reportes/dashboard/ejecutivo',
      'POST /api/reportes/exportar',
      'GET /api/reportes/filtros/configurables',
      'GET /api/reportes/health',
    ],
  })
})

module.exports = router
