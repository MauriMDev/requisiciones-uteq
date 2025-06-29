// ===== ARCHIVO: src/utils/helpers.js =====
const crypto = require('crypto')
const bcrypt = require('bcryptjs')

// Generar folio único
const generateFolio = (prefix = 'SOL') => {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${prefix}-${timestamp}-${random}`
}

// Generar número de orden
const generateOrderNumber = () => {
  const year = new Date().getFullYear()
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0')
  return `ORD-${year}-${timestamp}-${random}`
}

// Hash de password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12)
  return await bcrypt.hash(password, salt)
}

// Comparar password
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword)
}

// Generar token aleatorio
const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex')
}

// Formatear moneda
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount)
}

// Calcular paginación
const calculatePagination = (page = 1, limit = 10) => {
  const offset = (page - 1) * limit
  return {
    limit: parseInt(limit),
    offset: parseInt(offset),
    page: parseInt(page)
  }
}

// Sanitizar objeto para auditoria
const sanitizeForAudit = (obj, excludeFields = ['password_hash', 'password']) => {
  const sanitized = { ...obj }
  excludeFields.forEach(field => {
    if (sanitized[field]) {
      delete sanitized[field]
    }
  })
  return sanitized
}

module.exports = {
  generateFolio,
  generateOrderNumber,
  hashPassword,
  comparePassword,
  generateToken,
  formatCurrency,
  calculatePagination,
  sanitizeForAudit
}