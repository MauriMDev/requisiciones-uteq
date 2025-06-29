// ===== ARCHIVO: src/models/Usuario.js =====
module.exports = (sequelize, DataTypes) => {
  const Usuario = sequelize.define(
    'Usuario',
    {
      id_usuario: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      numero_empleado: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false,
      },
      nombre_completo: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      correo_institucional: {
        type: DataTypes.STRING(255),
        unique: true,
        allowNull: false,
        validate: {
          isEmail: true,
        },
      },
      telefono: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      departamento_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Departamentos',
          key: 'id_departamento',
        },
      },
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      rol: {
        type: DataTypes.ENUM(
          'solicitante',
          'aprobador',
          'administrativo',
          'admin_sistema'
        ),
        allowNull: false,
        defaultValue: 'solicitante',
      },
      estatus: {
        type: DataTypes.ENUM('activo', 'inactivo'),
        allowNull: false,
        defaultValue: 'activo',
      },
      fecha_registro: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      ultimo_acceso: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      creado_por: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Usuarios',
          key: 'id_usuario',
        },
      },
    },
    {
      tableName: 'usuarios',
      timestamps: true,
      createdAt: 'fecha_registro',
      updatedAt: 'fecha_actualizacion',
      indexes: [
        {
          unique: true,
          fields: ['numero_empleado'],
        },
        {
          unique: true,
          fields: ['correo_institucional'],
        },
        {
          fields: ['departamento_id'],
        },
        {
          fields: ['rol'],
        },
        {
          fields: ['estatus'],
        },
      ],
    }
  )

  return Usuario
}
