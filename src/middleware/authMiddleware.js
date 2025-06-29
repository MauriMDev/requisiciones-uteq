const jwt = require('jsonwebtoken')
const { Usuario } = require('../models')

// Middleware para verificar autenticación
const protect = async (req, res, next) => {
  try {
    let token

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado para acceder a esta ruta',
      })
    }

    try {
      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      // Buscar usuario
      const usuario = await Usuario.findByPk(decoded.id, {
        attributes: { exclude: ['password_hash'] },
      })

      if (!usuario) {
        return res.status(401).json({
          success: false,
          error: 'Usuario no encontrado',
        })
      }

      if (usuario.estatus !== 'activo') {
        return res.status(401).json({
          success: false,
          error: 'Usuario inactivo',
        })
      }

      req.user = usuario
      next()
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Token no válido',
      })
    }
  } catch (error) {
    next(error)
  }
}

// Middleware para verificar roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado',
      })
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        error: `Rol '${req.user.rol}' no autorizado para acceder a esta ruta`,
      })
    }

    next()
  }
}

// Middleware para verificar que el usuario puede acceder a sus propios recursos
const authorizeOwner = (req, res, next) => {
  const userId = req.params.userId || req.params.id

  if (req.user.rol === 'admin_sistema') {
    return next()
  }

  if (req.user.id_usuario.toString() !== userId) {
    return res.status(403).json({
      success: false,
      error: 'No autorizado para acceder a este recurso',
    })
  }

  next()
}

module.exports = {
  protect,
  authorize,
  authorizeOwner,
}
