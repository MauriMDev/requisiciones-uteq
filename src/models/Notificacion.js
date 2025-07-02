// ===== ARCHIVO: src/models/Notificacion.js - NUEVO =====
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
          model: 'usuarios',
          key: 'id_usuario',
        },
      },
      solicitud_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'solicitudes',
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
        type: DataTypes.ENUM('nueva_solicitud', 'cambio_estatus', 'aprobacion_requerida', 'compra_completada'),
        allowNull: false,
      },
      estatus: {
        type: DataTypes.ENUM('no_leida', 'leida'),
        defaultValue: 'no_leida',
      },
      fecha_envio: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      fecha_lectura: {
        type: DataTypes.DATE,
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
      tableName: 'notificaciones',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    }
  )

  return Notificacion
}