// ===== ARCHIVO: src/models/Cotizacion.js - NUEVO =====
module.exports = (sequelize, DataTypes) => {
  const Cotizacion = sequelize.define(
    'Cotizacion',
    {
      id_cotizacion: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      solicitud_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'solicitudes',
          key: 'id_solicitud',
        },
      },
      proveedor_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'proveedores',
          key: 'id_proveedor',
        },
      },
      precio_unitario: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      precio_total: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      tiempo_entrega_dias: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      terminos_pago: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      observaciones: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      fecha_cotizacion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      estatus: {
        type: DataTypes.ENUM('pendiente', 'enviada', 'seleccionada', 'rechazada'),
        defaultValue: 'pendiente',
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
      tableName: 'cotizaciones',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    }
  )

  return Cotizacion
}