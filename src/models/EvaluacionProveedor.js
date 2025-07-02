// ===== ARCHIVO: src/models/EvaluacionProveedor.js - NUEVO =====
module.exports = (sequelize, DataTypes) => {
  const EvaluacionProveedor = sequelize.define(
    'EvaluacionProveedor',
    {
      id_evaluacion: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      cotizacion_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'cotizaciones',
          key: 'id_cotizacion',
        },
      },
      puntuacion_precio: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: true,
      },
      puntuacion_calidad: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: true,
      },
      puntuacion_tiempo: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: true,
      },
      puntuacion_terminos: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: true,
      },
      puntuacion_total: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: true,
      },
      justificacion_seleccion: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      fecha_evaluacion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      evaluado_por: {
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
      tableName: 'evaluacion_proveedores',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    }
  )

  return EvaluacionProveedor
}