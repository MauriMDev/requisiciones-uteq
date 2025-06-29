// ===== ARCHIVO: src/utils/logger.js =====
const winston = require('winston')
const path = require('path')

// Configuración de niveles de log
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
}

// Colores para cada nivel
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
}

winston.addColors(colors)

// Formato de logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
)

// Transports para diferentes ambientes
const transports = [
  // Console para desarrollo
  new winston.transports.Console()
]

// Archivos de logs para producción
if (process.env.NODE_ENV === 'production') {
  transports.push(
    // Log de errores
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error'
    }),
    // Log combinado
    new winston.transports.File({
      filename: path.join('logs', 'combined.log')
    })
  )
}

// Crear logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'warn',
  levels,
  format,
  transports
})

module.exports = logger