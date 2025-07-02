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
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      codigo_departamento: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      estatus: {
        type: DataTypes.ENUM('activo', 'inactivo'),
        defaultValue: 'activo',
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
      tableName: 'departamentos',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    }
  )

  return Departamento
}
