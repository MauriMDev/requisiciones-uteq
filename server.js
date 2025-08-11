// ===== ARCHIVO: server.js =====
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const compression = require('compression')
require('dotenv').config()

// Importar servicios
const DatabaseService = require('./src/services/databaseService')
const logger = console

const app = express()

// Middleware básico
app.use(helmet())
app.use(cors())
app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Variable para controlar inicialización
let isInitialized = false

// Función para asegurar que todo esté inicializado
const ensureInitialized = async () => {
  if (!isInitialized) {
    try {
      logger.info('🔄 Inicializando servicios...')
      
      // 1. Conectar a la base de datos
      await DatabaseService.connect()
      logger.info('✅ Base de datos conectada')
      
      // 2. Inicializar modelos usando tu archivo existente
      const modelsManager = require('./src/models')
      modelsManager.initializeModels()
      logger.info('✅ Modelos inicializados desde src/models/index.js')
      
      isInitialized = true
      logger.info('🎉 Inicialización completa')
      
    } catch (error) {
      logger.error('❌ Error en inicialización:', error)
      throw error
    }
  }
}

// Middleware para asegurar inicialización en la primera petición
app.use(async (req, res, next) => {
  try {
    await ensureInitialized()
    next()
  } catch (error) {
    logger.error('❌ Error asegurando inicialización:', error)
    res.status(503).json({
      success: false,
      error: 'Servicios no disponibles',
      message: 'Error inicializando base de datos y modelos'
    })
  }
})

// Ruta de salud
app.get('/health', async (req, res) => {
  try {
    let dbStatus = false
    let modelsStatus = false
    
    try {
      dbStatus = await DatabaseService.isReady()
      
      // Verificar que los modelos estén disponibles
      const modelsManager = require('./src/models')
      const sequelize = modelsManager.getSequelize()
      modelsStatus = !!sequelize
    } catch (error) {
      logger.error('Error verificando estado:', error)
    }
    
    res.json({
      success: true,
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      services: {
        database: dbStatus ? 'connected' : 'disconnected',
        models: modelsStatus ? 'initialized' : 'not initialized',
        server: 'running'
      }
    })
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'error',
      error: error.message
    })
  }
})

// Importar rutas DESPUÉS del middleware de inicialización
const routes = require('./src/routes')
app.use('/', routes)

// Middleware para rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
    path: req.originalUrl,
  })
})

// Manejador de errores global
app.use((error, req, res, next) => {
  logger.error('Error no manejado:', {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
  })

  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    timestamp: new Date().toISOString(),
  })
})

// Función de cierre graceful
async function gracefulShutdown(signal) {
  try {
    logger.info(`🔄 Recibida señal ${signal}, cerrando aplicación...`)
    await DatabaseService.disconnect()
    process.exit(0)
  } catch (error) {
    logger.error('❌ Error durante el cierre:', error)
    process.exit(1)
  }
}

// Manejar señales de cierre
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

const PORT = process.env.PORT || 3000

// Iniciar servidor
app.listen(PORT, () => {
  logger.info(`🚀 Servidor corriendo en puerto ${PORT}`)
  logger.info(`🌍 Ambiente: ${process.env.NODE_ENV}`)
  logger.info(`📍 URL: http://localhost:${PORT}`)
})

module.exports = app