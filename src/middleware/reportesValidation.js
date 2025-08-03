// src/middleware/reportesValidation.js
const { body, query, validationResult } = require('express-validator')

/**
 * Middleware para manejar errores de validación
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Errores de validación',
      details: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
        value: error.value,
      })),
    })
  }
  next()
}

/**
 * Validación para rangos de fechas
 */
const validateDateRange = [
  query('fecha_inicio')
    .notEmpty()
    .withMessage('La fecha de inicio es requerida')
    .isISO8601()
    .withMessage('La fecha de inicio debe tener formato válido (YYYY-MM-DD)')
    .custom((value, { req }) => {
      const fechaInicio = new Date(value)
      const ahora = new Date()

      if (fechaInicio > ahora) {
        throw new Error('La fecha de inicio no puede ser futura')
      }

      // Validar que no sea muy antigua (máximo 5 años)
      const hace5Anos = new Date()
      hace5Anos.setFullYear(hace5Anos.getFullYear() - 5)

      if (fechaInicio < hace5Anos) {
        throw new Error('La fecha de inicio no puede ser anterior a 5 años')
      }

      return true
    }),

  query('fecha_fin')
    .notEmpty()
    .withMessage('La fecha de fin es requerida')
    .isISO8601()
    .withMessage('La fecha de fin debe tener formato válido (YYYY-MM-DD)')
    .custom((value, { req }) => {
      const fechaFin = new Date(value)
      const fechaInicio = new Date(req.query.fecha_inicio)
      const ahora = new Date()

      if (fechaFin > ahora) {
        throw new Error('La fecha de fin no puede ser futura')
      }

      if (fechaFin < fechaInicio) {
        throw new Error(
          'La fecha de fin debe ser posterior a la fecha de inicio'
        )
      }

      // Validar que el rango no sea mayor a 2 años
      const diffTime = Math.abs(fechaFin - fechaInicio)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays > 730) {
        // 2 años aproximadamente
        throw new Error('El rango de fechas no puede ser mayor a 2 años')
      }

      return true
    }),

  handleValidationErrors,
]

/**
 * Validación para parámetros de compras
 */
const validateComprasParams = [
  ...validateDateRange,

  query('departamento_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El ID del departamento debe ser un número entero positivo'),

  query('proveedor_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El ID del proveedor debe ser un número entero positivo'),

  query('estatus')
    .optional()
    .isIn(['ordenada', 'en_transito', 'entregada', 'cancelada'])
    .withMessage(
      'El estatus debe ser: ordenada, en_transito, entregada o cancelada'
    ),

  query('periodo')
    .optional()
    .isIn(['diario', 'semanal', 'mensual', 'anual'])
    .withMessage('El período debe ser: diario, semanal, mensual o anual'),

  handleValidationErrors,
]

/**
 * Validación para parámetros de solicitudes
 */
const validateSolicitudesParams = [
  ...validateDateRange,

  query('departamento_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El ID del departamento debe ser un número entero positivo'),

  query('usuario_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El ID del usuario debe ser un número entero positivo'),

  query('estatus')
    .optional()
    .isIn([
      'pendiente',
      'en_revision',
      'aprobada',
      'denegada',
      'en_proceso',
      'completada',
    ])
    .withMessage('El estatus debe ser válido'),

  query('urgencia')
    .optional()
    .isIn(['baja', 'media', 'alta', 'critica'])
    .withMessage('La urgencia debe ser: baja, media, alta o critica'),

  query('tipo_requisicion')
    .optional()
    .isIn(['productos', 'servicios', 'mantenimiento'])
    .withMessage(
      'El tipo de requisición debe ser: productos, servicios o mantenimiento'
    ),

  query('incluir_tiempos')
    .optional()
    .isBoolean()
    .withMessage('incluir_tiempos debe ser true o false'),

  handleValidationErrors,
]

/**
 * Validación para ranking de proveedores
 */
const validateRankingParams = [
  ...validateDateRange,

  query('criterio')
    .optional()
    .isIn(['volumen', 'frecuencia', 'calificacion'])
    .withMessage('El criterio debe ser: volumen, frecuencia o calificacion'),

  query('limite')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('El límite debe ser un número entre 1 y 50'),

  handleValidationErrors,
]

/**
 * Validación para cumplimiento de entregas
 */
const validateEntregasParams = [
  ...validateDateRange,

  query('proveedor_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El ID del proveedor debe ser un número entero positivo'),

  handleValidationErrors,
]

/**
 * Validación para cuellos de botella
 */
const validateCuellosBotellaParams = [
  ...validateDateRange,

  query('nivel_detalle')
    .optional()
    .isIn(['resumen', 'detallado'])
    .withMessage('El nivel de detalle debe ser: resumen o detallado'),

  handleValidationErrors,
]

/**
 * Validación para dashboard ejecutivo
 */
const validateDashboardParams = [
  query('periodo')
    .optional()
    .isIn(['hoy', 'semana', 'mes', 'trimestre', 'año', 'anio'])
    .withMessage('El período debe ser: hoy, semana, mes, trimestre o año'),

  query('tiempo_real')
    .optional()
    .isBoolean()
    .withMessage('tiempo_real debe ser true o false'),

  handleValidationErrors,
]

/**
 * Validación para exportación de reportes
 */
const validateExportParams = [
  body('tipo_reporte')
    .notEmpty()
    .withMessage('El tipo de reporte es requerido')
    .isIn([
      'compras_periodo',
      'solicitudes_estatus',
      'ranking_proveedores',
      'dashboard_ejecutivo',
    ])
    .withMessage('Tipo de reporte no válido'),

  body('formato')
    .notEmpty()
    .withMessage('El formato es requerido')
    .isIn(['pdf', 'xlsx', 'csv'])
    .withMessage('El formato debe ser: pdf, xlsx o csv'),

  body('parametros')
    .notEmpty()
    .withMessage('Los parámetros son requeridos')
    .isObject()
    .withMessage('Los parámetros deben ser un objeto')
    .custom((value) => {
      // Validar que tenga fechas obligatorias para la mayoría de reportes
      if (value.tipo_reporte !== 'dashboard_ejecutivo') {
        if (!value.fecha_inicio || !value.fecha_fin) {
          throw new Error(
            'Los parámetros deben incluir fecha_inicio y fecha_fin'
          )
        }

        // Validar formato de fechas
        if (!Date.parse(value.fecha_inicio) || !Date.parse(value.fecha_fin)) {
          throw new Error('Las fechas en parámetros deben tener formato válido')
        }
      }

      // ✅ VALIDACIÓN CORREGIDA: proveedor_nombre en lugar de proveedor_id
      if (
        value.proveedor_nombre &&
        typeof value.proveedor_nombre !== 'string'
      ) {
        throw new Error('proveedor_nombre debe ser una cadena de texto')
      }

      // Validar departamento_id si existe
      if (
        value.departamento_id &&
        (!Number.isInteger(Number(value.departamento_id)) ||
          Number(value.departamento_id) <= 0)
      ) {
        throw new Error('departamento_id debe ser un número entero positivo')
      }

      return true
    }),

  body('incluir_graficos')
    .optional()
    .isBoolean()
    .withMessage('incluir_graficos debe ser true o false'),

  handleValidationErrors,
]

/**
 * Validación para IDs de departamentos múltiples
 */
const validateMultipleDepartamentos = [
  query('departamento_ids')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        // Si es un string, intentar parsearlo como array
        try {
          const parsed = JSON.parse(value)
          if (!Array.isArray(parsed)) {
            throw new Error('departamento_ids debe ser un array')
          }

          // Validar que todos sean números enteros positivos
          if (
            !parsed.every(
              (id) => Number.isInteger(Number(id)) && Number(id) > 0
            )
          ) {
            throw new Error(
              'Todos los IDs de departamento deben ser números enteros positivos'
            )
          }

          // Límite máximo de departamentos
          if (parsed.length > 20) {
            throw new Error('No se pueden seleccionar más de 20 departamentos')
          }
        } catch (error) {
          throw new Error(
            'departamento_ids debe ser un array válido de números'
          )
        }
      } else if (Array.isArray(value)) {
        // Si ya es array, validar directamente
        if (
          !value.every((id) => Number.isInteger(Number(id)) && Number(id) > 0)
        ) {
          throw new Error(
            'Todos los IDs de departamento deben ser números enteros positivos'
          )
        }

        if (value.length > 20) {
          throw new Error('No se pueden seleccionar más de 20 departamentos')
        }
      }

      return true
    }),

  handleValidationErrors,
]

/**
 * Middleware para sanitizar parámetros de entrada
 */
const sanitizeParams = (req, res, next) => {
  // Convertir strings a números donde sea apropiado
  const numericFields = [
    'departamento_id',
    'proveedor_id',
    'usuario_id',
    'limite',
  ]

  numericFields.forEach((field) => {
    if (req.query[field] && !isNaN(req.query[field])) {
      req.query[field] = parseInt(req.query[field])
    }
  })

  // Convertir strings de boolean
  const booleanFields = ['incluir_tiempos', 'tiempo_real', 'incluir_graficos']

  booleanFields.forEach((field) => {
    if (req.query[field] !== undefined) {
      req.query[field] =
        req.query[field] === 'true' || req.query[field] === true
    }
    if (req.body[field] !== undefined) {
      req.body[field] = req.body[field] === 'true' || req.body[field] === true
    }
  })

  // Procesar departamento_ids si es string
  if (
    req.query.departamento_ids &&
    typeof req.query.departamento_ids === 'string'
  ) {
    try {
      req.query.departamento_ids = JSON.parse(req.query.departamento_ids)
    } catch (error) {
      // Si no es JSON válido, mantener como string para que la validación lo capture
    }
  }

  next()
}

/**
 * Middleware para limitar la frecuencia de reportes pesados
 */
const rateLimitReportes = (req, res, next) => {
  // Simple rate limiting basado en IP y usuario
  const key = `${req.ip}-${req.user?.id_usuario || 'anonymous'}`
  const now = Date.now()
  const windowMs = 60000 // 1 minuto
  const maxRequests = 10 // máximo 10 reportes por minuto

  if (!req.app.locals.reporteRateLimit) {
    req.app.locals.reporteRateLimit = new Map()
  }

  const userRequests = req.app.locals.reporteRateLimit.get(key) || []
  const recentRequests = userRequests.filter(
    (timestamp) => now - timestamp < windowMs
  )

  if (recentRequests.length >= maxRequests) {
    return res.status(429).json({
      success: false,
      error: 'Demasiadas solicitudes de reportes',
      message: `Máximo ${maxRequests} reportes por minuto. Intenta nuevamente en unos segundos.`,
      retry_after: Math.ceil((windowMs - (now - recentRequests[0])) / 1000),
    })
  }

  recentRequests.push(now)
  req.app.locals.reporteRateLimit.set(key, recentRequests)

  next()
}

/**
 * Middleware para validar que existan los IDs referenciados
 */
const validateReferencedIds = async (req, res, next) => {
  try {
    const { Departamento, Usuario } = require('../models') // ✅ REMOVIDO: Proveedor

    // Validar departamento_id si existe
    if (req.query.departamento_id || req.body.parametros?.departamento_id) {
      const departamentoId =
        req.query.departamento_id || req.body.parametros?.departamento_id
      const departamento = await Departamento.findByPk(departamentoId)
      if (!departamento) {
        return res.status(400).json({
          success: false,
          error: 'Departamento no encontrado',
          message: `No existe un departamento con ID ${departamentoId}`,
        })
      }
    }

    // Validar usuario_id si existe
    if (req.query.usuario_id || req.body.parametros?.usuario_id) {
      const usuarioId = req.query.usuario_id || req.body.parametros?.usuario_id
      const usuario = await Usuario.findByPk(usuarioId)
      if (!usuario) {
        return res.status(400).json({
          success: false,
          error: 'Usuario no encontrado',
          message: `No existe un usuario con ID ${usuarioId}`,
        })
      }
    }

    // Validar departamento_ids si existen (array)
    if (
      req.query.departamento_ids &&
      Array.isArray(req.query.departamento_ids)
    ) {
      const departamentos = await Departamento.findAll({
        where: { id_departamento: req.query.departamento_ids },
        attributes: ['id_departamento'],
      })

      if (departamentos.length !== req.query.departamento_ids.length) {
        const encontrados = departamentos.map((d) => d.id_departamento)
        const noEncontrados = req.query.departamento_ids.filter(
          (id) => !encontrados.includes(id)
        )

        return res.status(400).json({
          success: false,
          error: 'Departamentos no encontrados',
          message: `No existen departamentos con IDs: ${noEncontrados.join(', ')}`,
        })
      }
    }

    next()
  } catch (error) {
    console.error('Error en validación de IDs referenciados:', error)
    res.status(500).json({
      success: false,
      error: 'Error en validación de referencias',
      details: error.message,
    })
  }
}

module.exports = {
  // Validaciones específicas
  validateComprasParams,
  validateSolicitudesParams,
  validateRankingParams,
  validateEntregasParams,
  validateCuellosBotellaParams,
  validateDashboardParams,
  validateExportParams,
  validateMultipleDepartamentos,
  validateDateRange,

  // Middlewares utilitarios
  sanitizeParams,
  rateLimitReportes,
  validateReferencedIds,
  handleValidationErrors,
}
