// ===== ARCHIVO: src/models/ReporteGenerado.js - NUEVO =====
module.exports = (sequelize, DataTypes) => {
  const ReporteGenerado = sequelize.define(
    'ReporteGenerado',
    {
      id_reporte: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      generado_por: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'usuarios',
          key: 'id_usuario',
        },
      },
      tipo_reporte: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      nombre_reporte: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      parametros_reporte: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      ruta_archivo: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      fecha_generacion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      estatus: {
        type: DataTypes.ENUM('generando', 'completado', 'error'),
        defaultValue: 'generando',
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
      tableName: 'reportes_generados',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    }
  )

  return ReporteGenerado
}