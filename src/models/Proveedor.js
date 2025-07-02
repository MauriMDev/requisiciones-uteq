// ===== ARCHIVO: src/models/Proveedor.js - NUEVO =====
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
        allowNull: false,
        unique: true,
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
        defaultValue: 0.00,
      },
      estatus: {
        type: DataTypes.ENUM('activo', 'inactivo', 'suspendido'),
        defaultValue: 'activo',
      },
      fecha_registro: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
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
      tableName: 'proveedores',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    }
  )

  return Proveedor
}