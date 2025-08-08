const express = require('express')
const cors = require('cors')
const routes = require('./routes')
const DatabaseService = require('./services/databaseService')

const app = express()

// Middleware básico
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Rutas de la API
app.use('/', routes)

// Middleware para rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
    path: req.originalUrl,
    suggestion: 'Visita / para ver la documentación disponible',
  })
})

// Manejador de errores global
app.use((error, req, res, next) => {
  console.error('Error no manejado:', {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  })

  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    timestamp: new Date().toISOString(),
  })
})

// ===== FUNCIONES DE INICIALIZACIÓN =====

async function initializeServices() {
  try {
    // Conectar a la base de datos
    await DatabaseService.connect()
    console.log('✅ Servicios de base de datos inicializados')
  } catch (error) {
    console.error('❌ Error inicializando servicios:', error)
    process.exit(1)
  }
}

async function gracefulShutdown() {
  try {
    console.log('🔌 Cerrando conexión a la base de datos...')
    await DatabaseService.disconnect()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error durante el cierre:', error)
    process.exit(1)
  }
}

// Manejar cierre graceful de la aplicación
process.on('SIGTERM', async () => {
  console.log('🔄 Recibida señal SIGTERM, cerrando aplicación...')
  await gracefulShutdown()
})

process.on('SIGINT', async () => {
  console.log('🔄 Recibida señal SIGINT, cerrando aplicación...')
  await gracefulShutdown()
})

// Exportar app y función de inicialización
module.exports = { app, initializeServices }

// Si este archivo se ejecuta directamente, inicializar servicios
if (require.main === module) {
  initializeServices()
}
