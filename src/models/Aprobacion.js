// ===== ARCHIVO: src/models/Aprobacion.js =====
module.exports = (sequelize, DataTypes) => {
  const Aprobacion = sequelize.define(
    'Aprobacion',
    {
      id_aprobacion: {
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
      aprobador_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Usuarios',
          key: 'id_usuario',
        },
      },
      accion: {
        type: DataTypes.ENUM('aprobar', 'revisar', 'denegar'),
        allowNull: false,
      },
      comentarios: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      fecha_accion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      nivel_aprobacion: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
          min: 1,
          max: 5,
        },
      },
      estatus: {
        type: DataTypes.ENUM('pendiente', 'completada'),
        allowNull: false,
        defaultValue: 'pendiente',
      },
    },
    {
      tableName: 'aprobaciones',
      timestamps: true,
      createdAt: 'fecha_creacion',
      updatedAt: 'fecha_actualizacion',
      indexes: [
        {
          fields: ['solicitud_id'],
        },
        {
          fields: ['aprobador_id'],
        },
        {
          fields: ['estatus'],
        },
        {
          fields: ['nivel_aprobacion'],
        },
        {
          fields: ['fecha_accion'],
        },
      ],
    }
  )

  return Aprobacion
}
