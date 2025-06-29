// ===== ARCHIVO: src/models/Factura.js =====
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
          model: 'Compras',
          key: 'id_compra',
        },
      },
      folio_fiscal: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false,
      },
      serie_factura: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      monto_factura: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      iva: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.0,
        validate: {
          min: 0,
        },
      },
      total_factura: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      fecha_factura: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      fecha_recepcion: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      estatus: {
        type: DataTypes.ENUM('pendiente', 'recibida', 'pagada', 'cancelada'),
        allowNull: false,
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
    },
    {
      tableName: 'facturas',
      timestamps: true,
      createdAt: 'fecha_creacion',
      updatedAt: 'fecha_actualizacion',
      indexes: [
        {
          unique: true,
          fields: ['folio_fiscal'],
        },
        {
          fields: ['compra_id'],
        },
        {
          fields: ['estatus'],
        },
        {
          fields: ['fecha_factura'],
        },
        {
          fields: ['total_factura'],
        },
      ],
    }
  )

  return Factura
}
