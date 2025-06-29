// ===== ARCHIVO: src/models/Solicitud.js =====
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
        unique: true,
        allowNull: false,
      },
      solicitante_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Usuarios',
          key: 'id_usuario',
        },
      },
      departamento_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Departamentos',
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
        allowNull: false,
        validate: {
          min: 1,
        },
      },
      justificacion: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      urgencia: {
        type: DataTypes.ENUM('baja', 'media', 'alta', 'critica'),
        allowNull: false,
        defaultValue: 'media',
      },
      presupuesto_estimado: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
        validate: {
          min: 0,
        },
      },
      estatus: {
        type: DataTypes.ENUM(
          'pendiente',
          'en_revision',
          'aprobada',
          'denegada',
          'en_proceso',
          'completada'
        ),
        allowNull: false,
        defaultValue: 'pendiente',
      },
      fecha_creacion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      fecha_actualizacion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      comentarios_generales: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'solicitudes',
      timestamps: true,
      createdAt: 'fecha_creacion',
      updatedAt: 'fecha_actualizacion',
      indexes: [
        {
          unique: true,
          fields: ['folio_solicitud'],
        },
        {
          fields: ['solicitante_id'],
        },
        {
          fields: ['departamento_id'],
        },
        {
          fields: ['estatus'],
        },
        {
          fields: ['urgencia'],
        },
        {
          fields: ['tipo_requisicion'],
        },
        {
          fields: ['fecha_creacion'],
        },
      ],
    }
  )

  return Solicitud
}
