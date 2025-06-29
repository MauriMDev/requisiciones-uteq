// ===== ARCHIVO: src/models/Compra.js =====
module.exports = (sequelize, DataTypes) => {
  const Compra = sequelize.define(
    'Compra',
    {
      id_compra: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      numero_orden: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false,
      },
      solicitud_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Solicitudes',
          key: 'id_solicitud',
        },
      },
      proveedor_seleccionado: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Proveedores',
          key: 'id_proveedor',
        },
      },
      monto_total: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      fecha_compra: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      fecha_entrega_estimada: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      fecha_entrega_real: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      estatus: {
        type: DataTypes.ENUM(
          'ordenada',
          'en_transito',
          'entregada',
          'cancelada'
        ),
        allowNull: false,
        defaultValue: 'ordenada',
      },
      terminos_entrega: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      observaciones: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      creado_por: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Usuarios',
          key: 'id_usuario',
        },
      },
    },
    {
      tableName: 'compras',
      timestamps: true,
      createdAt: 'fecha_creacion',
      updatedAt: 'fecha_actualizacion',
      indexes: [
        {
          unique: true,
          fields: ['numero_orden'],
        },
        {
          fields: ['solicitud_id'],
        },
        {
          fields: ['proveedor_seleccionado'],
        },
        {
          fields: ['estatus'],
        },
        {
          fields: ['fecha_compra'],
        },
        {
          fields: ['creado_por'],
        },
      ],
    }
  )

  return Compra
}
