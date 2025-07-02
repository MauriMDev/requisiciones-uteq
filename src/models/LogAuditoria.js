// ===== ARCHIVO: src/models/LogAuditoria.js - NUEVO =====
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
        allowNull: true,
        references: {
          model: 'usuarios',
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
        allowNull: true,
      },
      datos_anteriores: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      datos_nuevos: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      ip_usuario: {
        type: DataTypes.INET,
        allowNull: true,
      },
      fecha_accion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'logs_auditoria',
      timestamps: false,
      underscored: true,
    }
  )

  return LogAuditoria
}