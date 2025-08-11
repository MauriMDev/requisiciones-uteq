// ===== ARCHIVO: src/models/index.js - ACTUALIZADO =====
const { Sequelize } = require('sequelize')

let sequelize = null

try {
  // Intentar obtener de la configuración de database primero
  const { sequelize: dbSequelize } = require('../config/database')
  sequelize = dbSequelize
  console.log('✅ Usando instancia de Sequelize desde config/database.js')
} catch (error) {
  console.log('⚠️ No se pudo obtener Sequelize desde config, intentando DatabaseService...')
  
  try {
    // Fallback: obtener de DatabaseService
    const DatabaseService = require('../services/databaseService')
    sequelize = DatabaseService.getSequelize()
    console.log('✅ Usando instancia de Sequelize desde DatabaseService')
  } catch (serviceError) {
    console.error('❌ Error obteniendo Sequelize:', serviceError.message)
    throw new Error('No se pudo inicializar Sequelize desde ninguna fuente')
  }
}

if (!sequelize) {
  throw new Error('Instancia de Sequelize no disponible')
}

console.log('📦 Cargando todos los modelos...')

// Importar TODOS los modelos directamente
const Usuario = require('./Usuario')(sequelize, Sequelize.DataTypes)
const Departamento = require('./Departamento')(sequelize, Sequelize.DataTypes)
const Solicitud = require('./Solicitud')(sequelize, Sequelize.DataTypes)
const Aprobacion = require('./Aprobacion')(sequelize, Sequelize.DataTypes)
const Proveedor = require('./Proveedor')(sequelize, Sequelize.DataTypes)
const Cotizacion = require('./Cotizacion')(sequelize, Sequelize.DataTypes)
const Compra = require('./Compra')(sequelize, Sequelize.DataTypes)
const Factura = require('./Factura')(sequelize, Sequelize.DataTypes)
const Notificacion = require('./Notificacion')(sequelize, Sequelize.DataTypes)
const DocumentoAdjunto = require('./DocumentoAdjunto')(sequelize, Sequelize.DataTypes)
const LogAuditoria = require('./LogAuditoria')(sequelize, Sequelize.DataTypes)
const ConfiguracionSistema = require('./ConfiguracionSistema')(sequelize, Sequelize.DataTypes)
const EvaluacionProveedor = require('./EvaluacionProveedor')(sequelize, Sequelize.DataTypes)
const ReporteGenerado = require('./ReporteGenerado')(sequelize, Sequelize.DataTypes)

console.log('🔗 Configurando asociaciones...')

// Configurar asociaciones directamente
try {
  // Usuario - Departamento
  Usuario.belongsTo(Departamento, {
    foreignKey: 'departamento_id',
    as: 'departamento',
  })
  Departamento.hasMany(Usuario, {
    foreignKey: 'departamento_id',
    as: 'usuarios',
  })

  // Usuario auto-referencia (creado_por)
  Usuario.belongsTo(Usuario, {
    foreignKey: 'creado_por',
    as: 'creador',
  })
  Usuario.hasMany(Usuario, {
    foreignKey: 'creado_por',
    as: 'usuarios_creados',
  })

  // Usuario - Solicitud (solicitante)
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

  // Usuario - Aprobación (aprobador)
  Usuario.hasMany(Aprobacion, {
    foreignKey: 'aprobador_id',
    as: 'aprobaciones_realizadas',
  })
  Aprobacion.belongsTo(Usuario, {
    foreignKey: 'aprobador_id',
    as: 'aprobador',
  })

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

  // Cotización - EvaluacionProveedor
  Cotizacion.hasOne(EvaluacionProveedor, {
    foreignKey: 'cotizacion_id',
    as: 'evaluacion',
  })
  EvaluacionProveedor.belongsTo(Cotizacion, {
    foreignKey: 'cotizacion_id',
    as: 'cotizacion',
  })

  // Usuario - EvaluacionProveedor (evaluado_por)
  Usuario.hasMany(EvaluacionProveedor, {
    foreignKey: 'evaluado_por',
    as: 'evaluaciones_realizadas',
  })
  EvaluacionProveedor.belongsTo(Usuario, {
    foreignKey: 'evaluado_por',
    as: 'evaluador',
  })

  // Solicitud - Compra
  Solicitud.hasOne(Compra, {
    foreignKey: 'solicitud_id',
    as: 'compra',
  })
  Compra.belongsTo(Solicitud, {
    foreignKey: 'solicitud_id',
    as: 'solicitud',
  })

  // Usuario - Compra (creado_por)
  Usuario.hasMany(Compra, {
    foreignKey: 'creado_por',
    as: 'compras_creadas',
  })
  Compra.belongsTo(Usuario, {
    foreignKey: 'creado_por',
    as: 'creador',
  })

  // Compra - Factura
  Compra.hasMany(Factura, {
    foreignKey: 'compra_id',
    as: 'facturas',
  })
  Factura.belongsTo(Compra, {
    foreignKey: 'compra_id',
    as: 'compra',
  })

  // Usuario - Notificación (usuario_destino)
  Usuario.hasMany(Notificacion, {
    foreignKey: 'usuario_destino',
    as: 'notificaciones_recibidas',
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

  // Usuario - DocumentoAdjunto (subido_por)
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
  LogAuditoria.belongsTo(Usuario, {
    foreignKey: 'usuario_id',
    as: 'usuario',
  })

  // Usuario - ConfiguracionSistema (modificado_por)
  Usuario.hasMany(ConfiguracionSistema, {
    foreignKey: 'modificado_por',
    as: 'configuraciones_modificadas',
  })
  ConfiguracionSistema.belongsTo(Usuario, {
    foreignKey: 'modificado_por',
    as: 'usuario_modificacion',
  })

  // Usuario - ReporteGenerado (generado_por)
  Usuario.hasMany(ReporteGenerado, {
    foreignKey: 'generado_por',
    as: 'reportes_generados',
  })
  ReporteGenerado.belongsTo(Usuario, {
    foreignKey: 'generado_por',
    as: 'usuario_generador',
  })

  console.log('✅ Modelos y asociaciones configurados correctamente')

} catch (error) {
  console.error('❌ Error configurando asociaciones:', error)
  throw error
}

// Función opcional para inicialización desde server
const initializeModels = () => {
  console.log('✅ Modelos ya inicializados desde índice')
  return module.exports
}

// EXPORTAR DIRECTAMENTE como esperan tus controladores
module.exports = {
  sequelize,
  Sequelize,
  Usuario,
  Departamento,
  Solicitud,
  Aprobacion,
  Proveedor,
  Cotizacion,
  EvaluacionProveedor,
  Compra,
  Factura,
  Notificacion,
  DocumentoAdjunto,
  LogAuditoria,
  ConfiguracionSistema,
  ReporteGenerado,
  
  // Función opcional
  initializeModels,
}