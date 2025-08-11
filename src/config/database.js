// ===== ARCHIVO: src/config/database.js - CREANDO INSTANCIA DE SEQUELIZE =====
const { Sequelize } = require('sequelize')

// Determinar ambiente usando solo NODE_ENV
const environment = process.env.NODE_ENV || 'development'
console.log(`🔧 Ambiente detectado: ${environment}`)

const config = {
  development: {
    username: process.env.DB_USER_LOCAL,
    password: process.env.DB_PASSWORD_LOCAL,
    database: process.env.DB_NAME_LOCAL,
    host: process.env.DB_HOST_LOCAL,
    port: parseInt(process.env.DB_PORT_LOCAL),
    dialect: 'postgres',
    logging: console.log,
    dialectOptions: {
      ssl: false
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
    }
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    pool: {
      max: 20,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true
    }
  }
}

// DEBUG: Mostrar configuración final
console.log('🔍 Configuración final:', JSON.stringify(config[environment], null, 2))

// Crear la instancia de Sequelize
let sequelize

try {
  console.log('⚠️ Creando instancia de Sequelize desde config/database.js...')
  
  const envConfig = config[environment]
  
  if (environment === 'production') {
    // Para producción en Vercel
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL no está definida en producción')
    }
    
    console.log('🔧 Usando DATABASE_URL para producción')
    sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      protocol: 'postgres',
      logging: false,
      dialectModule: require('pg'), // Forzar módulo pg para Vercel
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        },
        keepAlive: true,
        statement_timeout: 30000,
        query_timeout: 30000,
        connectionTimeoutMillis: 30000,
        idleTimeoutMillis: 30000
      },
      pool: {
        max: 5, // Reducir para serverless
        min: 0,
        acquire: 30000,
        idle: 10000,
        evict: 1000
      },
      define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true
      },
      retry: {
        match: [
          /ConnectionError/,
          /ConnectionRefusedError/,
          /ConnectionTimedOutError/,
          /TimeoutError/,
          /SequelizeConnectionError/,
          /SequelizeConnectionRefusedError/,
          /SequelizeHostNotFoundError/,
          /SequelizeHostNotReachableError/,
          /SequelizeInvalidConnectionError/,
          /SequelizeConnectionTimedOutError/
        ],
        max: 3
      }
    })
  } else {
    // Para desarrollo
    console.log('🔧 Usando configuración de desarrollo')
    
    if (!envConfig.username || !envConfig.password || !envConfig.database) {
      throw new Error('Faltan credenciales de base de datos para desarrollo')
    }
    
    sequelize = new Sequelize(
      envConfig.database, 
      envConfig.username, 
      envConfig.password, 
      {
        host: envConfig.host,
        port: envConfig.port,
        dialect: envConfig.dialect,
        logging: envConfig.logging,
        dialectOptions: envConfig.dialectOptions,
        pool: envConfig.pool,
        define: envConfig.define
      }
    )
  }
  
  console.log('✅ Instancia de Sequelize creada exitosamente desde config')
  
} catch (error) {
  console.error('❌ Error creando Sequelize desde config:', error.message)
  
  // Debug específico para Vercel
  if (environment === 'production') {
    console.log('🔍 Variables de entorno disponibles:')
    console.log('- NODE_ENV:', process.env.NODE_ENV)
    console.log('- DATABASE_URL disponible:', !!process.env.DATABASE_URL)
    console.log('- DATABASE_URL longitud:', process.env.DATABASE_URL?.length || 0)
    
    // Verificar si pg está disponible
    try {
      require('pg')
      console.log('- Módulo pg: ✅ disponible')
    } catch (pgError) {
      console.log('- Módulo pg: ❌ no disponible -', pgError.message)
    }
  }
  
  throw error
}

// Función para conectar y probar la conexión
const connectDatabase = async () => {
  try {
    console.log('🔄 Probando conexión a la base de datos...')
    await sequelize.authenticate()
    console.log('✅ Conexión a PostgreSQL establecida correctamente')
    return true
  } catch (error) {
    console.error('❌ Error conectando a PostgreSQL:', error.message)
    return false
  }
}

// Función para cerrar la conexión
const disconnectDatabase = async () => {
  try {
    if (sequelize) {
      await sequelize.close()
      console.log('✅ Conexión a PostgreSQL cerrada')
    }
  } catch (error) {
    console.error('❌ Error cerrando conexión:', error.message)
  }
}

module.exports = {
  config,
  sequelize,
  environment,
  connectDatabase,
  disconnectDatabase
}