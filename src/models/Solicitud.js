// ===== ARCHIVO: src/models/Solicitud.js - CORREGIDO =====
module.exports = (sequelize, DataTypes) => {
  const Solicitud = sequelize.define(
    'Solicitud',
    {
      id_solicitud: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      folio_solicitud: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      solicitante_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'usuarios',
          key: 'id_usuario',
        },
      },
      departamento_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'departamentos',
          key: 'id_departamento',
        },
      },
      tipo_requisicion: {
        type: DataTypes.ENUM('productos', 'servicios', 'mantenimiento'),
        allowNull: false,
      },
      descripcion_detallada: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      cantidad: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
      justificacion: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      urgencia: {
        type: DataTypes.ENUM('baja', 'media', 'alta', 'critica'),
        defaultValue: 'media',
      },
      presupuesto_estimado: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      // CAMPOS NUEVOS AGREGADOS
      fecha_necesidad: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      items: {
        type: DataTypes.JSONB,
        defaultValue: [],
        allowNull: true,
      },
      archivos_adjuntos: {
        type: DataTypes.JSONB,
        defaultValue: [],
        allowNull: true,
      },
      // FIN CAMPOS NUEVOS
      estatus: {
        type: DataTypes.ENUM(
          'pendiente',
          'en_revision',
          'aprobada',
          'denegada',
          'en_proceso',
          'completada'
        ),
        defaultValue: 'pendiente',
      },
      fecha_creacion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      fecha_actualizacion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      comentarios_generales: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'solicitudes',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    }
  )

  return Solicitud
}



















