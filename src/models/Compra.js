// ===== ARCHIVO: src/models/Compra.js - NUEVO =====
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
        allowNull: false,
        unique: true,
      },
      solicitud_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'solicitudes',
          key: 'id_solicitud',
        },
      },
      proveedor_seleccionado: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'proveedores',
          key: 'id_proveedor',
        },
      },
      monto_total: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      fecha_compra: {
        type: DataTypes.DATE,
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
        type: DataTypes.ENUM('ordenada', 'en_transito', 'entregada', 'cancelada'),
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
      tableName: 'compras',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    }
  )

  return Compra
}