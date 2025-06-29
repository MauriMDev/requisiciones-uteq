// ===== ARCHIVO: src/controllers/authController.js =====
const jwt = require('jsonwebtoken')
const { Sequelize } = require('sequelize') // AGREGAR esta línea
const { Usuario, Departamento } = require('../models')
const { hashPassword, comparePassword } = require('../utils/helpers')
const logger = require('../utils/logger')

// Generar JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  })
}

// @desc    Registrar usuario
// @route   POST /api/auth/register
// @access  Public (solo para admin)
const register = async (req, res, next) => {
  try {
    const {
      numero_empleado,
      nombre_completo,
      correo_institucional,
      telefono,
      departamento_id,
      password,
      rol
    } = req.body

    // Verificar si el usuario ya existe
    const existingUser = await Usuario.findOne({
      where: {
        [Sequelize.Op.or]: [
          { numero_empleado },
          { correo_institucional }
        ]
      }
    })

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Usuario ya existe con ese número de empleado o correo'
      })
    }

    // Verificar que el departamento existe
    const departamento = await Departamento.findByPk(departamento_id)
    if (!departamento) {
      return res.status(400).json({
        success: false,
        error: 'Departamento no encontrado'
      })
    }

    // Hash del password
    const password_hash = await hashPassword(password)

    // Crear usuario
    const usuario = await Usuario.create({
      numero_empleado,
      nombre_completo,
      correo_institucional,
      telefono,
      departamento_id,
      password_hash,
      rol: rol || 'solicitante',
      creado_por: req.user ? req.user.id_usuario : null
    })

    // Generar token
    const token = generateToken(usuario.id_usuario)

    logger.info(`Usuario registrado: ${usuario.correo_institucional}`)

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        usuario: {
          id: usuario.id_usuario,
          numero_empleado: usuario.numero_empleado,
          nombre_completo: usuario.nombre_completo,
          correo_institucional: usuario.correo_institucional,
          rol: usuario.rol,
          departamento_id: usuario.departamento_id
        },
        token
      }
    })
  } catch (error) {
    next(error)
  }
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
        error: 'Correo y contraseña son requeridos'
      })
    }

    // Buscar usuario
    const usuario = await Usuario.findOne({
      where: { correo_institucional },
      include: [{
        model: Departamento,
        as: 'departamento',
        attributes: ['nombre_departamento', 'codigo_departamento']
      }]
    })

    if (!usuario) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      })
    }

    // Verificar que el usuario esté activo
    if (usuario.estatus !== 'activo') {
      return res.status(401).json({
        success: false,
        error: 'Usuario inactivo'
      })
    }

    // Verificar password
    const isMatch = await comparePassword(password, usuario.password_hash)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
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
          departamento: usuario.departamento
        },
        token
      }
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
      include: [{
        model: Departamento,
        as: 'departamento',
        attributes: ['nombre_departamento', 'codigo_departamento']
      }]
    })

    res.json({
      success: true,
      data: { usuario }
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  register,
  login,
  getMe
}