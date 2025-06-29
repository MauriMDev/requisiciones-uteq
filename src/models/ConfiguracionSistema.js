// ===== ARCHIVO: src/models/ConfiguracionSistema.js =====
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
        unique: true,
        allowNull: false,
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
        allowNull: false,
        defaultValue: 'string',
      },
      fecha_modificacion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      modificado_por: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Usuarios',
          key: 'id_usuario',
        },
      },
    },
    {
      tableName: 'configuracion_sistema',
      timestamps: true,
      createdAt: 'fecha_creacion',
      updatedAt: 'fecha_modificacion',
      indexes: [
        {
          unique: true,
          fields: ['clave_configuracion'],
        },
        {
          fields: ['modificado_por'],
        },
        {
          fields: ['tipo_dato'],
        },
      ],
    }
  )

  return ConfiguracionSistema
}
