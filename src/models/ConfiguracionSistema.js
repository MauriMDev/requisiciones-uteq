// ===== ARCHIVO: src/models/ConfiguracionSistema.js - NUEVO =====
module.exports = (sequelize, DataTypes) => {
  const ConfiguracionSistema = sequelize.define(
    'ConfiguracionSistema',
    {
      id_config: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      clave_configuracion: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      valor_configuracion: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      tipo_dato: {
        type: DataTypes.ENUM('string', 'integer', 'decimal', 'boolean'),
        defaultValue: 'string',
      },
      fecha_modificacion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      modificado_por: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'usuarios',
          key: 'id_usuario',
        },
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
      tableName: 'configuracion_sistema',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    }
  )

  return ConfiguracionSistema
}