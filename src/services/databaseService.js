// ===== ARCHIVO: src/services/databaseService.js - SIMPLIFICADO =====
const { sequelize, connectDatabase, disconnectDatabase } = require('../config/database')

class DatabaseService {
  constructor() {
    this.sequelize = sequelize
    this.isConnected = false
  }

  // Conectar a la base de datos
  async connect() {
    try {
      if (this.isConnected) {
        console.log('✅ Ya existe conexión activa a la BD')
        return this.sequelize
      }

      console.log('🔧 Conectando a la base de datos...')
      
      // Usar la función de conexión del config
      const connected = await connectDatabase()
      
      if (connected) {
        this.isConnected = true
        console.log('✅ DatabaseService conectado correctamente')
        return this.sequelize
      } else {
        throw new Error('No se pudo establecer conexión a la base de datos')
      }
      
    } catch (error) {
      console.error('❌ Error en DatabaseService.connect():', error.message)
      this.isConnected = false
      throw error
    }
  }

  // Verificar si la conexión está activa
  async isReady() {
    try {
      if (!this.sequelize) {
        return false
      }
      await this.sequelize.authenticate()
      return true
    } catch (error) {
      console.error('Error verificando conexión:', error.message)
      this.isConnected = false
      return false
    }
  }

  // Desconectar de la base de datos
  async disconnect() {
    try {
      await disconnectDatabase()
      this.isConnected = false
      console.log('✅ DatabaseService desconectado')
    } catch (error) {
      console.error('❌ Error en DatabaseService.disconnect():', error.message)
      throw error
    }
  }

  // Obtener la instancia de Sequelize
  getSequelize() {
    if (!this.sequelize) {
      throw new Error('Base de datos no inicializada. La instancia de Sequelize no está disponible.')
    }
    return this.sequelize
  }

  // Métodos de utilidad para transacciones
  async startTransaction() {
    if (!this.sequelize) {
      throw new Error('Base de datos no conectada')
    }
    return await this.sequelize.transaction()
  }

  // Método para queries raw (usar con cuidado)
  async rawQuery(sql, options = {}) {
    if (!this.sequelize) {
      throw new Error('Base de datos no conectada')
    }
    const { Sequelize } = require('sequelize')
    return await this.sequelize.query(sql, {
      type: Sequelize.QueryTypes.SELECT,
      ...options
    })
  }

  // Método para verificar el estado de la conexión
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      hasSequelize: !!this.sequelize,
      environment: process.env.NODE_ENV || 'development'
    }
  }
}

// Exportar instancia singleton
const databaseService = new DatabaseService()
module.exports = databaseService