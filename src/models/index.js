// ===== ARCHIVO: src/models/index.js =====
const { Sequelize } = require('sequelize')
const DatabaseService = require('../services/databaseService')

// Inicializar Sequelize - primero intentar obtener de DatabaseService
let sequelize = DatabaseService.getSequelize()

// Si no existe, crear nueva instancia (fallback)
if (!sequelize) {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'sistema_requisiciones',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres', // CAMBIAR de mysql a postgres
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      define: {
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    }
  )
}

// Importar modelos - CORREGIR rutas relativas
const Usuario = require('./Usuario')(sequelize, Sequelize.DataTypes)
const Departamento = require('./Departamento')(sequelize, Sequelize.DataTypes)
const Solicitud = require('./Solicitud')(sequelize, Sequelize.DataTypes)
const Aprobacion = require('./Aprobacion')(sequelize, Sequelize.DataTypes)
const Proveedor = require('./Proveedor')(sequelize, Sequelize.DataTypes)
const Cotizacion = require('./Cotizacion')(sequelize, Sequelize.DataTypes)
const Compra = require('./Compra')(sequelize, Sequelize.DataTypes)
const Factura = require('./Factura')(sequelize, Sequelize.DataTypes)
const Notificacion = require('./Notificacion')(sequelize, Sequelize.DataTypes)
const DocumentoAdjunto = require('./DocumentoAdjunto')(
  sequelize,
  Sequelize.DataTypes
)
const LogAuditoria = require('./LogAuditoria')(sequelize, Sequelize.DataTypes)
const ConfiguracionSistema = require('./ConfiguracionSistema')(
  sequelize,
  Sequelize.DataTypes
)

// Configurar asociaciones
const setupAssociations = () => {
  // Usuario - Departamento
  Usuario.belongsTo(Departamento, {
    foreignKey: 'departamento_id',
    as: 'departamento',
  })
  Departamento.hasMany(Usuario, {
    foreignKey: 'departamento_id',
    as: 'usuarios',
  })

  // Usuario - Solicitud
  Usuario.hasMany(Solicitud, {
    foreignKey: 'solicitante_id',
    as: 'solicitudes',
  })
  Solicitud.belongsTo(Usuario, {
    foreignKey: 'solicitante_id',
    as: 'solicitante',
  })

  // Departamento - Solicitud
  Departamento.hasMany(Solicitud, {
    foreignKey: 'departamento_id',
    as: 'solicitudes',
  })
  Solicitud.belongsTo(Departamento, {
    foreignKey: 'departamento_id',
    as: 'departamento',
  })

  // Solicitud - Aprobación
  Solicitud.hasMany(Aprobacion, {
    foreignKey: 'solicitud_id',
    as: 'aprobaciones',
  })
  Aprobacion.belongsTo(Solicitud, {
    foreignKey: 'solicitud_id',
    as: 'solicitud',
  })

  // Usuario - Aprobación
  Usuario.hasMany(Aprobacion, {
    foreignKey: 'aprobador_id',
    as: 'aprobaciones',
  })
  Aprobacion.belongsTo(Usuario, { foreignKey: 'aprobador_id', as: 'aprobador' })

  // Solicitud - Cotización
  Solicitud.hasMany(Cotizacion, {
    foreignKey: 'solicitud_id',
    as: 'cotizaciones',
  })
  Cotizacion.belongsTo(Solicitud, {
    foreignKey: 'solicitud_id',
    as: 'solicitud',
  })

  // Proveedor - Cotización
  Proveedor.hasMany(Cotizacion, {
    foreignKey: 'proveedor_id',
    as: 'cotizaciones',
  })
  Cotizacion.belongsTo(Proveedor, {
    foreignKey: 'proveedor_id',
    as: 'proveedor',
  })

  // Solicitud - Compra
  Solicitud.hasOne(Compra, { foreignKey: 'solicitud_id', as: 'compra' })
  Compra.belongsTo(Solicitud, { foreignKey: 'solicitud_id', as: 'solicitud' })

  // Proveedor - Compra
  Proveedor.hasMany(Compra, {
    foreignKey: 'proveedor_seleccionado',
    as: 'compras',
  })
  Compra.belongsTo(Proveedor, {
    foreignKey: 'proveedor_seleccionado',
    as: 'proveedor',
  })

  // Compra - Factura
  Compra.hasMany(Factura, { foreignKey: 'compra_id', as: 'facturas' })
  Factura.belongsTo(Compra, { foreignKey: 'compra_id', as: 'compra' })

  // Usuario - Notificación
  Usuario.hasMany(Notificacion, {
    foreignKey: 'usuario_destino',
    as: 'notificaciones',
  })
  Notificacion.belongsTo(Usuario, {
    foreignKey: 'usuario_destino',
    as: 'usuario',
  })

  // Solicitud - Notificación
  Solicitud.hasMany(Notificacion, {
    foreignKey: 'solicitud_id',
    as: 'notificaciones',
  })
  Notificacion.belongsTo(Solicitud, {
    foreignKey: 'solicitud_id',
    as: 'solicitud',
  })

  // Solicitud - DocumentoAdjunto
  Solicitud.hasMany(DocumentoAdjunto, {
    foreignKey: 'solicitud_id',
    as: 'documentos',
  })
  DocumentoAdjunto.belongsTo(Solicitud, {
    foreignKey: 'solicitud_id',
    as: 'solicitud',
  })

  // Usuario - DocumentoAdjunto
  Usuario.hasMany(DocumentoAdjunto, {
    foreignKey: 'subido_por',
    as: 'documentos_subidos',
  })
  DocumentoAdjunto.belongsTo(Usuario, {
    foreignKey: 'subido_por',
    as: 'usuario_subida',
  })

  // Usuario - LogAuditoria
  Usuario.hasMany(LogAuditoria, {
    foreignKey: 'usuario_id',
    as: 'logs_auditoria',
  })
  LogAuditoria.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' })

  // Usuario - ConfiguracionSistema
  Usuario.hasMany(ConfiguracionSistema, {
    foreignKey: 'modificado_por',
    as: 'configuraciones_modificadas',
  })
  ConfiguracionSistema.belongsTo(Usuario, {
    foreignKey: 'modificado_por',
    as: 'usuario_modificacion',
  })
}

// Configurar asociaciones
setupAssociations()

// Exportar todo
module.exports = {
  sequelize,
  Sequelize,
  Usuario,
  Departamento,
  Solicitud,
  Aprobacion,
  Proveedor,
  Cotizacion,
  Compra,
  Factura,
  Notificacion,
  DocumentoAdjunto,
  LogAuditoria,
  ConfiguracionSistema,
}
