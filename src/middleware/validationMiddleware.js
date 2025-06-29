const { body, param, query, validationResult } = require('express-validator')

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Errores de validación',
      details: errors.array(),
    })
  }

  next()
}

// Validaciones para usuarios
const validateUsuario = [
  body('numero_empleado')
    .notEmpty()
    .withMessage('Número de empleado es requerido')
    .isLength({ min: 3, max: 50 })
    .withMessage('Número de empleado debe tener entre 3 y 50 caracteres'),

  body('nombre_completo')
    .notEmpty()
    .withMessage('Nombre completo es requerido')
    .isLength({ min: 2, max: 255 })
    .withMessage('Nombre debe tener entre 2 y 255 caracteres'),

  body('correo_institucional')
    .isEmail()
    .withMessage('Correo electrónico no válido')
    .normalizeEmail(),

  body('departamento_id')
    .isInt({ min: 1 })
    .withMessage('ID de departamento debe ser un número válido'),

  body('rol')
    .isIn(['solicitante', 'aprobador', 'administrativo', 'admin_sistema'])
    .withMessage('Rol no válido'),

  handleValidationErrors,
]

// Validaciones para solicitudes
const validateSolicitud = [
  body('tipo_requisicion')
    .isIn(['productos', 'servicios', 'mantenimiento'])
    .withMessage('Tipo de requisición no válido'),

  body('descripcion_detallada')
    .notEmpty()
    .withMessage('Descripción detallada es requerida')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Descripción debe tener entre 10 y 2000 caracteres'),

  body('cantidad')
    .isInt({ min: 1 })
    .withMessage('Cantidad debe ser un número mayor a 0'),

  body('justificacion')
    .notEmpty()
    .withMessage('Justificación es requerida')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Justificación debe tener entre 10 y 1000 caracteres'),

  body('urgencia')
    .isIn(['baja', 'media', 'alta', 'critica'])
    .withMessage('Nivel de urgencia no válido'),

  body('presupuesto_estimado')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Presupuesto debe ser un número decimal válido')
    .custom((value) => {
      if (parseFloat(value) < 0) {
        throw new Error('Presupuesto no puede ser negativo')
      }
      return true
    }),

  handleValidationErrors,
]

// Validaciones para proveedores
const validateProveedor = [
  body('nombre_proveedor')
    .notEmpty()
    .withMessage('Nombre del proveedor es requerido')
    .isLength({ min: 2, max: 255 })
    .withMessage('Nombre debe tener entre 2 y 255 caracteres'),

  body('rfc')
    .notEmpty()
    .withMessage('RFC es requerido')
    .isLength({ min: 12, max: 13 })
    .withMessage('RFC debe tener 12 o 13 caracteres')
    .matches(/^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/)
    .withMessage('Formato de RFC no válido'),

  body('email')
    .optional()
    .isEmail()
    .withMessage('Correo electrónico no válido')
    .normalizeEmail(),

  body('telefono')
    .optional()
    .isMobilePhone('es-MX')
    .withMessage('Número de teléfono no válido'),

  handleValidationErrors,
]

// Validación de parámetros ID
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID debe ser un número entero válido'),

  handleValidationErrors,
]

// Validación para paginación
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página debe ser un número mayor a 0'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Límite debe ser un número entre 1 y 100'),

  handleValidationErrors,
]

module.exports = {
  handleValidationErrors,
  validateUsuario,
  validateSolicitud,
  validateProveedor,
  validateId,
  validatePagination,
}
