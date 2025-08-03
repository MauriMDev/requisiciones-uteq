// ===== ARCHIVO: server.js USANDO banner.js =====
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const compression = require('compression')
const path = require('path');
require('dotenv').config()

const { sequelize } = require('./src/models')
const routes = require('./src/routes')
const { errorHandler, notFound } = require('./src/middleware/errorMiddleware')
const logger = require('./src/utils/logger')
const DatabaseService = require('./src/services/databaseService')
const { showBanner, showServerInfo } = require('./src/utils/banner') // IMPORTAR banner

const app = express()

// Servir archivos estáticos desde la carpeta uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware de seguridad
app.use(helmet())
app.use(cors())
app.use(compression())

// Middleware general
app.use(
  morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) },
  })
)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Rutas principales
app.use('/', routes)

// Ruta de salud mejorada
app.get('/health', async (req, res) => {
  try {
    const dbStatus = await DatabaseService.isReady()
    
    res.json({
      success: true,
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      services: {
        database: dbStatus ? 'connected' : 'disconnected'
      },
      system: {
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        nodeVersion: process.version
      }
    })
  } catch (error) {
    logger.error('Error en health check:', error)
    res.status(503).json({
      success: false,
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

// Middleware de manejo de errores
app.use(notFound)
app.use(errorHandler)

const PORT = process.env.PORT || 3000

// Funciones de inicialización
async function initializeServices() {
  try {
    await DatabaseService.connect()
    await sequelize.authenticate()
    logger.info('✅ Servicios de base de datos inicializados')
  } catch (error) {
    logger.error('❌ Error inicializando servicios:', error)
    process.exit(1)
  }
}

async function gracefulShutdown() {
  try {
    logger.info('🔌 Cerrando conexión a la base de datos...')
    await DatabaseService.disconnect()
    await sequelize.close()
    process.exit(0)
  } catch (error) {
    logger.error('❌ Error durante el cierre:', error)
    process.exit(1)
  }
}

// Iniciar servidor
const startServer = async () => {
  try {
    await initializeServices()
    
    app.listen(PORT, () => {
      logger.info(`🚀 Servidor corriendo en puerto ${PORT}`)
      logger.info(`🌍 Ambiente: ${process.env.NODE_ENV}`)
      
      // USAR las funciones del banner.js
      showBanner()
      showServerInfo(PORT, process.env.NODE_ENV)
    })
  } catch (error) {
    logger.error('Error al iniciar servidor:', error)
    process.exit(1)
  }
}

// Manejar cierre graceful
process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)

// Iniciar si se ejecuta directamente
if (require.main === module) {
  startServer()
}

module.exports = app