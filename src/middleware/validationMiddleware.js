const { body, param, validationResult } = require('express-validator')

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    })
  }

  next()
}

// Validaciones para crear solicitudes (basado en tu BD)
const validateSolicitud = [
  body('tipo_requisicion')
    .isIn(['productos', 'servicios', 'mantenimiento'])
    .withMessage('Tipo de requisición debe ser: productos, servicios o mantenimiento'),

  body('descripcion_detallada')
    .notEmpty()
    .withMessage('Descripción detallada es requerida')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Descripción debe tener entre 10 y 2000 caracteres')
    .trim(),

  body('cantidad')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Cantidad debe ser un número entero mayor a 0'),

  body('justificacion')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Justificación no debe exceder 1000 caracteres')
    .trim(),

  body('urgencia')
    .optional()
    .isIn(['baja', 'media', 'alta', 'critica'])
    .withMessage('Urgencia debe ser: baja, media, alta o critica'),

  body('presupuesto_estimado')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Presupuesto debe ser un número decimal válido')
    .custom((value) => {
      if (value !== undefined && parseFloat(value) < 0) {
        throw new Error('Presupuesto no puede ser negativo')
      }
      return true
    }),

  body('fecha_necesidad')
    .optional()
    .isISO8601()
    .withMessage('Fecha de necesidad debe tener formato válido (YYYY-MM-DD)')
    .custom((value) => {
      if (value && new Date(value) < new Date()) {
        throw new Error('Fecha de necesidad no puede ser anterior a hoy')
      }
      return true
    }),

  body('comentarios_generales')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Comentarios generales no debe exceder 1000 caracteres')
    .trim(),

  // Validación para items (campo JSONB)
  body('items')
    .optional()
    .isArray()
    .withMessage('Items debe ser un arreglo'),

  body('items.*.nombre')
    .if(body('items').exists())
    .notEmpty()
    .withMessage('El nombre del item es requerido')
    .isLength({ min: 2, max: 255 })
    .withMessage('Nombre del item debe tener entre 2 y 255 caracteres'),

  body('items.*.cantidad')
    .if(body('items').exists())
    .isInt({ min: 1 })
    .withMessage('Cantidad del item debe ser un número mayor a 0'),

  body('items.*.unidad')
    .if(body('items').exists())
    .notEmpty()
    .withMessage('Unidad del item es requerida')
    .isLength({ max: 50 })
    .withMessage('Unidad no debe exceder 50 caracteres'),

  body('items.*.precio_estimado')
    .if(body('items').exists())
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Precio estimado debe ser un número decimal válido')
    .custom((value) => {
      if (value !== undefined && parseFloat(value) < 0) {
        throw new Error('Precio estimado no puede ser negativo')
      }
      return true
    }),

  body('items.*.justificacion')
    .if(body('items').exists())
    .optional()
    .isLength({ max: 500 })
    .withMessage('Justificación del item no debe exceder 500 caracteres'),

  handleValidationErrors,
]

// Validaciones para actualizar solicitudes (campos opcionales)
const validateSolicitudUpdate = [
  body('tipo_requisicion')
    .optional()
    .isIn(['productos', 'servicios', 'mantenimiento'])
    .withMessage('Tipo de requisición debe ser: productos, servicios o mantenimiento'),

  body('descripcion_detallada')
    .optional()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Descripción debe tener entre 10 y 2000 caracteres')
    .trim(),

  body('cantidad')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Cantidad debe ser un número entero mayor a 0'),

  body('justificacion')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Justificación no debe exceder 1000 caracteres')
    .trim(),

  body('urgencia')
    .optional()
    .isIn(['baja', 'media', 'alta', 'critica'])
    .withMessage('Urgencia debe ser: baja, media, alta o critica'),

  body('presupuesto_estimado')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Presupuesto debe ser un número decimal válido')
    .custom((value) => {
      if (value !== undefined && parseFloat(value) < 0) {
        throw new Error('Presupuesto no puede ser negativo')
      }
      return true
    }),

  body('fecha_necesidad')
    .optional()
    .isISO8601()
    .withMessage('Fecha de necesidad debe tener formato válido (YYYY-MM-DD)')
    .custom((value) => {
      if (value && new Date(value) < new Date()) {
        throw new Error('Fecha de necesidad no puede ser anterior a hoy')
      }
      return true
    }),

  body('comentarios_generales')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Comentarios generales no debe exceder 1000 caracteres')
    .trim(),

  // Validación para items actualizados
  body('items')
    .optional()
    .isArray()
    .withMessage('Items debe ser un arreglo'),

  body('items.*.nombre')
    .if(body('items').exists())
    .notEmpty()
    .withMessage('El nombre del item es requerido')
    .isLength({ min: 2, max: 255 })
    .withMessage('Nombre del item debe tener entre 2 y 255 caracteres'),

  body('items.*.cantidad')
    .if(body('items').exists())
    .isInt({ min: 1 })
    .withMessage('Cantidad del item debe ser un número mayor a 0'),

  body('items.*.unidad')
    .if(body('items').exists())
    .notEmpty()
    .withMessage('Unidad del item es requerida')
    .isLength({ max: 50 })
    .withMessage('Unidad no debe exceder 50 caracteres'),

  body('items.*.precio_estimado')
    .if(body('items').exists())
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Precio estimado debe ser un número decimal válido')
    .custom((value) => {
      if (value !== undefined && parseFloat(value) < 0) {
        throw new Error('Precio estimado no puede ser negativo')
      }
      return true
    }),

  body('items.*.justificacion')
    .if(body('items').exists())
    .optional()
    .isLength({ max: 500 })
    .withMessage('Justificación del item no debe exceder 500 caracteres'),

  handleValidationErrors,
]

// Validaciones para usuarios (corregido según tu BD)
const validateUsuario = [
  body('numero_empleado')
    .notEmpty()
    .withMessage('Número de empleado es requerido')
    .isLength({ min: 3, max: 50 })
    .withMessage('Número de empleado debe tener entre 3 y 50 caracteres')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Número de empleado solo puede contener letras mayúsculas y números'),

  body('nombre_completo')
    .notEmpty()
    .withMessage('Nombre completo es requerido')
    .isLength({ min: 2, max: 255 })
    .withMessage('Nombre completo debe tener entre 2 y 255 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('Nombre completo solo puede contener letras y espacios')
    .trim(),

  body('correo_institucional')
    .isEmail()
    .withMessage('Correo institucional debe ser válido')
    .isLength({ max: 255 })
    .withMessage('Correo institucional no debe exceder 255 caracteres')
    .normalizeEmail()
    .custom((value) => {
      // Aquí puedes agregar validación específica para el dominio institucional
      // Por ejemplo: if (!value.endsWith('@uteq.edu.mx'))
      return true
    }),

  body('telefono')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Teléfono no debe exceder 20 caracteres')
    .matches(/^[0-9\-\+\(\)\s]+$/)
    .withMessage('Teléfono debe contener solo números, espacios, guiones, paréntesis y +'),

  body('rol')
    .isIn(['solicitante', 'aprobador', 'administrativo', 'admin_sistema'])
    .withMessage('Rol debe ser: solicitante, aprobador, administrativo o admin_sistema'),

  body('departamento_id')
    .isInt({ min: 1 })
    .withMessage('ID de departamento debe ser un número válido'),

  body('password')
    .isLength({ min: 8, max: 255 })
    .withMessage('Contraseña debe tener entre 8 y 255 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial'),

  handleValidationErrors,
]

// Validación para IDs en parámetros
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID debe ser un número entero positivo'),
  handleValidationErrors,
]

// Validación para cancelación de solicitudes
const validateCancelacion = [
  body('motivo_cancelacion')
    .optional()
    .isLength({ min: 10, max: 500 })
    .withMessage('Motivo de cancelación debe tener entre 10 y 500 caracteres')
    .trim(),
  handleValidationErrors,
]

// Validación para filtros de búsqueda
const validateQueryFilters = [
  // Query parameters para filtros
  param('estatus')
    .optional()
    .isIn(['pendiente', 'en_revision', 'aprobada', 'denegada', 'en_proceso', 'completada'])
    .withMessage('Estatus no válido'),

  param('tipo_requisicion')
    .optional()
    .isIn(['productos', 'servicios', 'mantenimiento'])
    .withMessage('Tipo de requisición no válido'),

  param('urgencia')
    .optional()
    .isIn(['baja', 'media', 'alta', 'critica'])
    .withMessage('Urgencia no válida'),

  param('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página debe ser un número mayor a 0'),

  param('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Límite debe ser un número entre 1 y 100'),

  handleValidationErrors,
]

module.exports = {
  validateSolicitud,
  validateSolicitudUpdate,
  validateUsuario,
  validateId,
  validateCancelacion,
  validateQueryFilters,
  handleValidationErrors,
}