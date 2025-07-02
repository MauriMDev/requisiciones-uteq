// ===== ARCHIVO: src/middleware/authMiddleware.js CORREGIDO =====
const jwt = require('jsonwebtoken')
const { Usuario, Departamento } = require('../models')

// Middleware para proteger rutas
const protect = async (req, res, next) => {
  try {
    let token

    // Verificar si el token existe en el header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado, token requerido',
      })
    }

    try {
      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      // Buscar usuario por id_usuario (no por id)
      const usuario = await Usuario.findByPk(decoded.id, {
        attributes: { exclude: ['password_hash'] },
        include: [
          {
            model: Departamento,
            as: 'departamento',
            attributes: ['nombre_departamento', 'codigo_departamento'],
          },
        ],
      })

      if (!usuario) {
        return res.status(401).json({
          success: false,
          error: 'Usuario no encontrado',
        })
      }

      // Verificar que el usuario esté activo
      if (usuario.estatus !== 'activo') {
        return res.status(401).json({
          success: false,
          error: 'Usuario inactivo',
        })
      }

      // Agregar usuario a la request
      req.user = usuario
      next()
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido',
      })
    }
  } catch (error) {
    console.error('Error en middleware de autenticación:', error)
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    })
  }
}

// Middleware para verificar roles específicos
// Middleware para verificar roles específicos
const authorize = (...roles) => {
  console.log('🔵 Roles permitidos:', roles)
  return (req, res, next) => {
    if (!req.user) {
      console.log('❌ No hay usuario en req.user')
      return res.status(401).json({
        success: false,
        error: 'No autorizado',
      })
    }

    console.log('👤 Usuario completo:', JSON.stringify(req.user, null, 2))
    console.log('🎭 Rol del usuario:', `"${req.user.rol}"`)
    console.log('🎯 Roles permitidos:', roles)
    console.log('✅ ¿Rol incluido?:', roles.includes(req.user.rol))
    
    // Verificar si hay espacios o caracteres raros
    console.log('🔍 Longitud del rol:', req.user.rol?.length)
    console.log('🔍 Código ASCII del rol:', req.user.rol?.split('').map(char => char.charCodeAt(0)))

    if (!roles.includes(req.user.rol)) {
      console.log('🚫 ACCESO DENEGADO - Rol no autorizado')
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para acceder a este recurso',
      })
    }

    console.log('✅ ACCESO PERMITIDO')
    next()
  }
}

// Middleware para verificar departamento
const authorizeOwnDepartment = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'No autorizado',
    })
  }

  // Los admin_sistema pueden acceder a todo
  if (req.user.rol === 'admin_sistema') {
    return next()
  }

  // Para otros roles, verificar departamento si es necesario
  // Esta lógica puede expandirse según las reglas de negocio
  next()
}

module.exports = {
  protect,
  authorize,
  authorizeOwnDepartment,
}
