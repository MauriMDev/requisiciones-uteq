// ===== ARCHIVO: src/models/Cotizacion.js =====
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
          model: 'Solicitudes',
          key: 'id_solicitud',
        },
      },
      proveedor_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Proveedores',
          key: 'id_proveedor',
        },
      },
      precio_unitario: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      precio_total: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      tiempo_entrega_dias: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
        },
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
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      estatus: {
        type: DataTypes.ENUM(
          'pendiente',
          'enviada',
          'seleccionada',
          'rechazada'
        ),
        allowNull: false,
        defaultValue: 'pendiente',
      },
    },
    {
      tableName: 'cotizaciones',
      timestamps: true,
      createdAt: 'fecha_creacion',
      updatedAt: 'fecha_actualizacion',
      indexes: [
        {
          fields: ['solicitud_id'],
        },
        {
          fields: ['proveedor_id'],
        },
        {
          fields: ['estatus'],
        },
        {
          fields: ['fecha_cotizacion'],
        },
        {
          fields: ['precio_total'],
        },
      ],
    }
  )

  return Cotizacion
}
