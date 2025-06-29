// ===== ARCHIVO: src/services/databaseService.js =====
const { Sequelize } = require('sequelize')

class DatabaseService {
  constructor() {
    this.sequelize = null
    this.isConnected = false
  }

  // Conectar a la base de datos
  async connect() {
    try {
      if (this.sequelize) {
        return this.sequelize
      }

      this.sequelize = new Sequelize(
        process.env.DB_NAME || 'sistema_requisiciones',
        process.env.DB_USER || 'postgres',
        process.env.DB_PASSWORD || '',
        {
          host: process.env.DB_HOST || 'localhost',
          port: process.env.DB_PORT || 5432,
          dialect: 'postgres',
          logging: process.env.NODE_ENV === 'development' ? console.log : false,
          pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
          },
          define: {
            timestamps: true,
            underscored: true,
            // PostgreSQL maneja automáticamente created_at y updated_at
            createdAt: 'created_at',
            updatedAt: 'updated_at'
          }
        }
      )

      await this.sequelize.authenticate()
      this.isConnected = true
      console.log('✅ Conexión a PostgreSQL establecida correctamente')
      
      return this.sequelize
    } catch (error) {
      console.error('❌ Error conectando a PostgreSQL:', error)
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
      console.error('Error verificando conexión:', error)
      return false
    }
  }

  // Desconectar de la base de datos
  async disconnect() {
    try {
      if (this.sequelize) {
        await this.sequelize.close()
        this.isConnected = false
        console.log('✅ Conexión a PostgreSQL cerrada')
      }
    } catch (error) {
      console.error('❌ Error cerrando conexión:', error)
      throw error
    }
  }

  // Obtener la instancia de Sequelize
  getSequelize() {
    return this.sequelize
  }

  // Sincronizar modelos (solo para desarrollo)
  async syncModels(force = false) {
    try {
      if (!this.sequelize) {
        throw new Error('Base de datos no conectada')
      }

      if (process.env.NODE_ENV === 'production' && force) {
        throw new Error('No se permite force sync en producción')
      }

      await this.sequelize.sync({ force })
      console.log('✅ Modelos sincronizados correctamente con PostgreSQL')
    } catch (error) {
      console.error('❌ Error sincronizando modelos:', error)
      throw error
    }
  }

  // Ejecutar migrations
  async runMigrations() {
    // Implementar lógica de migrations si es necesario
    console.log('🔄 Ejecutando migrations...')
    // Aquí puedes integrar Sequelize CLI o un sistema de migrations personalizado
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
    return await this.sequelize.query(sql, {
      type: Sequelize.QueryTypes.SELECT,
      ...options
    })
  }

  // Estadísticas de la base de datos (PostgreSQL)
  async getStats() {
    try {
      const stats = await this.rawQuery(`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as insert_count,
          n_tup_upd as update_count,
          n_tup_del as delete_count,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size
        FROM pg_stat_user_tables
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      `)
      
      return stats
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error)
      return []
    }
  }
}

// Exportar instancia singleton
const databaseService = new DatabaseService()
module.exports = databaseService