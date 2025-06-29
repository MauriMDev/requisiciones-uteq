// ===== ARCHIVO: src/models/Notificacion.js =====
module.exports = (sequelize, DataTypes) => {
  const Notificacion = sequelize.define(
    'Notificacion',
    {
      id_notificacion: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      usuario_destino: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Usuarios',
          key: 'id_usuario',
        },
      },
      solicitud_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Solicitudes',
          key: 'id_solicitud',
        },
      },
      titulo_notificacion: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      mensaje: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      tipo: {
        type: DataTypes.ENUM(
          'nueva_solicitud',
          'cambio_estatus',
          'aprobacion_requerida',
          'compra_completada'
        ),
        allowNull: false,
      },
      estatus: {
        type: DataTypes.ENUM('no_leida', 'leida'),
        allowNull: false,
        defaultValue: 'no_leida',
      },
      fecha_envio: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      fecha_lectura: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'notificaciones',
      timestamps: true,
      createdAt: 'fecha_envio',
      updatedAt: 'fecha_actualizacion',
      indexes: [
        {
          fields: ['usuario_destino'],
        },
        {
          fields: ['solicitud_id'],
        },
        {
          fields: ['estatus'],
        },
        {
          fields: ['tipo'],
        },
        {
          fields: ['fecha_envio'],
        },
      ],
    }
  )

  return Notificacion
}
