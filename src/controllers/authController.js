// ===== ARCHIVO: src/controllers/authController.js CORREGIDO =====
const jwt = require('jsonwebtoken')
const { Usuario, Departamento } = require('../models')
const { hashPassword, comparePassword } = require('../utils/helpers')
const logger = require('../utils/logger')

// Generar JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  })
}

// @desc    Login usuario
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { correo_institucional, password } = req.body

    // Validar input
    if (!correo_institucional || !password) {
      return res.status(400).json({
        success: false,
        error: 'Correo y contraseña son requeridos',
      })
    }

    // Buscar usuario
    const usuario = await Usuario.findOne({
      where: { correo_institucional },
      include: [
        {
          model: Departamento,
          as: 'departamento',
          attributes: ['id_departamento', 'nombre_departamento', 'codigo_departamento'],
        },
      ],
    })
    console.log(usuario)

    if (!usuario) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas',
      })
    }

    // Verificar que el usuario esté activo
    if (usuario.estatus !== 'activo') {
      return res.status(401).json({
        success: false,
        error: 'Usuario inactivo',
      })
    }

    // Verificar password
    console.log(password, usuario.password_hash)
    const isMatch = await comparePassword(password, usuario.password_hash)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas',
      })
    }

    // Actualizar último acceso
    await usuario.update({ ultimo_acceso: new Date() })

    // Generar token
    const token = generateToken(usuario.id_usuario)

    logger.info(`Usuario autenticado: ${usuario.correo_institucional}`)

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        usuario: {
          id: usuario.id_usuario,
          numero_empleado: usuario.numero_empleado,
          nombre_completo: usuario.nombre_completo,
          correo_institucional: usuario.correo_institucional,
          rol: usuario.rol,
          departamento_id: usuario.departamento_id,
          departamento: usuario.departamento,
        },
        token,
      },
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Obtener perfil del usuario actual
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const usuario = await Usuario.findByPk(req.user.id_usuario, {
      attributes: { exclude: ['password_hash'] },
      include: [
        {
          model: Departamento,
          as: 'departamento',
          attributes: ['id_departamento', 'nombre_departamento', 'codigo_departamento'],
        },
      ],
    })

    res.json({
      success: true,
      data: { usuario },
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Cerrar sesión
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res, next) => {
  try {
    // En JWT no necesitamos hacer nada en el servidor para logout
    // El cliente simplemente elimina el token
    logger.info(`Usuario cerró sesión: ${req.user.correo_institucional}`)

    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente',
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  login,
  getMe,
  logout,
}