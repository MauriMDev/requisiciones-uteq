// ===== ARCHIVO: src/models/Departamento.js =====
module.exports = (sequelize, DataTypes) => {
  const Departamento = sequelize.define(
    'Departamento',
    {
      id_departamento: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nombre_departamento: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      codigo_departamento: {
        type: DataTypes.STRING(20),
        unique: true,
        allowNull: false,
      },
      descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      estatus: {
        type: DataTypes.ENUM('activo', 'inactivo'),
        allowNull: false,
        defaultValue: 'activo',
      },
    },
    {
      tableName: 'departamentos',
      timestamps: true,
      createdAt: 'fecha_creacion',
      updatedAt: 'fecha_actualizacion',
      indexes: [
        {
          unique: true,
          fields: ['codigo_departamento'],
        },
        {
          fields: ['estatus'],
        },
      ],
    }
  )

  return Departamento
}
