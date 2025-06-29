// ===== ARCHIVO: src/models/Proveedor.js =====
module.exports = (sequelize, DataTypes) => {
  const Proveedor = sequelize.define(
    'Proveedor',
    {
      id_proveedor: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nombre_proveedor: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      rfc: {
        type: DataTypes.STRING(13),
        unique: true,
        allowNull: false,
        validate: {
          len: [12, 13],
        },
      },
      direccion: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      telefono: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          isEmail: true,
        },
      },
      contacto_principal: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      calificacion_promedio: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: true,
        defaultValue: 0.0,
        validate: {
          min: 0,
          max: 10,
        },
      },
      estatus: {
        type: DataTypes.ENUM('activo', 'inactivo', 'suspendido'),
        allowNull: false,
        defaultValue: 'activo',
      },
      fecha_registro: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'proveedores',
      timestamps: true,
      createdAt: 'fecha_registro',
      updatedAt: 'fecha_actualizacion',
      indexes: [
        {
          unique: true,
          fields: ['rfc'],
        },
        {
          fields: ['estatus'],
        },
        {
          fields: ['calificacion_promedio'],
        },
      ],
    }
  )

  return Proveedor
}
