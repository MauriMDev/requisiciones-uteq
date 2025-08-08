// ===== ARCHIVO: src/routes/index.js =====
const express = require('express')
const router = express.Router()

// Importar rutas de módulos
const authRoutes = require('./authRoutes')
const usuariosRoutes = require('./usuariosRoutes')
const solicitudesRoutes = require('./solicitudesRoutes')
const comprasRoutes = require('./comprasRoutes')
const reportesRoutes = require('./reportesRoutes')

// Definir rutas
router.use('/auth', authRoutes)
router.use('/usuarios', usuariosRoutes)
router.use('/solicitudes', solicitudesRoutes)
router.use('/compras', comprasRoutes)
router.use('/reportes', reportesRoutes)

// Documentación de la API
router.get('/', (req, res) => {
  res.json({
    message: 'Sistema de Gestión de Compras API',
    version: '1.0.0',
    description: 'API para gestión completa de compras institucionales',
    endpoints: {
      health: 'GET /health',
      auth: 'POST /api/auth/*',
      usuarios: 'GET /api/usuarios',
      departamentos: 'GET /api/departamentos',
      solicitudes: 'GET /api/solicitudes',
      aprobaciones: 'GET /api/aprobaciones',
      proveedores: 'GET /api/proveedores',
      cotizaciones: 'GET /api/cotizaciones',
      compras: 'GET /api/compras',
      facturas: 'GET /api/facturas',
      reportes: 'GET /api/reportes',
      notificaciones: 'GET /api/notificaciones'
    },
    documentation: {
      auth: {
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        refresh: 'POST /api/auth/refresh'
      },
      solicitudes: {
        list: 'GET /api/solicitudes',
        create: 'POST /api/solicitudes',
        get: 'GET /api/solicitudes/{id}',
        update: 'PUT /api/solicitudes/{id}',
        delete: 'DELETE /api/solicitudes/{id}'
      }
    }
  })
})

module.exports = router

