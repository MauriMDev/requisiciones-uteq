const logger = require('../utils/logger')

// Middleware para rutas no encontradas
const notFound = (req, res, next) => {
  const error = new Error(`Ruta no encontrada - ${req.originalUrl}`)
  res.status(404)
  next(error)
}

// Middleware para manejo de errores
const errorHandler = (err, req, res, next) => {
  let error = { ...err }
  error.message = err.message

  // Log del error
  logger.error({
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  })

  // Errores de Sequelize
  if (err.name === 'SequelizeValidationError') {
    const message = err.errors.map((val) => val.message).join(', ')
    error = { message, statusCode: 400 }
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const message = 'Recurso duplicado'
    error = { message, statusCode: 400 }
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    const message = 'Referencia no válida'
    error = { message, statusCode: 400 }
  }

  // Errores de JWT
  if (err.name === 'JsonWebTokenError') {
    const message = 'Token no válido'
    error = { message, statusCode: 401 }
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expirado'
    error = { message, statusCode: 401 }
  }

  // Errores de casting
  if (err.name === 'CastError') {
    const message = 'Recurso no encontrado'
    error = { message, statusCode: 404 }
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Error del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

module.exports = {
  notFound,
  errorHandler,
}
