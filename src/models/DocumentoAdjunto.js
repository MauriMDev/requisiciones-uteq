// ===== ARCHIVO: src/models/DocumentoAdjunto.js =====
module.exports = (sequelize, DataTypes) => {
  const DocumentoAdjunto = sequelize.define(
    'DocumentoAdjunto',
    {
      id_documento: {
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
      nombre_archivo: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      ruta_archivo: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      tipo_archivo: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      tamaño_archivo: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      fecha_subida: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      subido_por: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Usuarios',
          key: 'id_usuario',
        },
      },
      tipo_documento: {
        type: DataTypes.ENUM(
          'solicitud_pdf',
          'recibo',
          'factura',
          'cotizacion',
          'otro'
        ),
        allowNull: false,
        defaultValue: 'otro',
      },
    },
    {
      tableName: 'documentos_adjuntos',
      timestamps: true,
      createdAt: 'fecha_subida',
      updatedAt: 'fecha_actualizacion',
      indexes: [
        {
          fields: ['solicitud_id'],
        },
        {
          fields: ['subido_por'],
        },
        {
          fields: ['tipo_documento'],
        },
        {
          fields: ['fecha_subida'],
        },
      ],
    }
  )

  return DocumentoAdjunto
}
