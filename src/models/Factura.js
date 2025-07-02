// ===== ARCHIVO: src/models/Factura.js - NUEVO =====
module.exports = (sequelize, DataTypes) => {
  const Factura = sequelize.define(
    'Factura',
    {
      id_factura: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      compra_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'compras',
          key: 'id_compra',
        },
      },
      folio_fiscal: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      serie_factura: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      monto_factura: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      iva: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.00,
      },
      total_factura: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      fecha_factura: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      fecha_recepcion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      estatus: {
        type: DataTypes.ENUM('pendiente', 'recibida', 'pagada', 'cancelada'),
        defaultValue: 'pendiente',
      },
      ruta_archivo_pdf: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      ruta_archivo_xml: {
        type: DataTypes.STRING(500),
        allowNull: true,
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
      tableName: 'facturas',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    }
  )

  return Factura
}