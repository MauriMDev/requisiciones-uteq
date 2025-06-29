// ===== ARCHIVO: src/models/LogAuditoria.js =====
module.exports = (sequelize, DataTypes) => {
  const LogAuditoria = sequelize.define(
    'LogAuditoria',
    {
      id_log: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Usuarios',
          key: 'id_usuario',
        },
      },
      accion_realizada: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      tabla_afectada: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      registro_afectado: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      datos_anteriores: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      datos_nuevos: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      ip_usuario: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      fecha_accion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'logs_auditoria',
      timestamps: false,
      indexes: [
        {
          fields: ['usuario_id'],
        },
        {
          fields: ['tabla_afectada'],
        },
        {
          fields: ['fecha_accion'],
        },
        {
          fields: ['accion_realizada'],
        },
      ],
    }
  )

  return LogAuditoria
}
