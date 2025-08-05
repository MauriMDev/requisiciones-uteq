const { Usuario, Departamento } = require('../models');
const bcrypt = require('bcrypt');

class UsuariosController {
  // Obtener todos los usuarios
  async obtenerUsuarios(req, res) {
    try {
      const { page = 1, limit = 10, rol, estatus } = req.query;
      const offset = (page - 1) * limit;

      const whereConditions = {};
      if (rol) whereConditions.rol = rol;
      if (estatus) whereConditions.estatus = estatus;

      const { count, rows: usuarios } = await Usuario.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: Departamento,
            as: 'departamento',
            attributes: ['nombre_departamento', 'codigo_departamento']
          }
        ],
        attributes: { exclude: ['password_hash'] },
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['id_usuario', 'ASC']]
      });

      res.json({
        success: true,
        data: usuarios,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Crear nuevo usuario
  async crearUsuario(req, res) {
    try {
      const { password, ...userData } = req.body;
      
      // Validar campos requeridos
      if (!password || !userData.correo_institucional || !userData.nombre_completo) {
        return res.status(400).json({
          success: false,
          message: 'Campos requeridos faltantes'
        });
      }

      // Encriptar contraseña
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const nuevoUsuario = await Usuario.create({
        ...userData,
        password_hash: passwordHash,
        creado_por: req.user.id_usuario
      });

      res.status(201).json({
        success: true,
        data: {
          ...nuevoUsuario.toJSON(),
          password_hash: undefined
        }
      });
    } catch (error) {
      console.error('Error al crear usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Actualizar usuario
  async actualizarUsuario(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (updates.password) {
        const saltRounds = 12;
        updates.password_hash = await bcrypt.hash(updates.password, saltRounds);
        delete updates.password;
      }

      const [updated] = await Usuario.update(updates, {
        where: { id_usuario: id }
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      const usuarioActualizado = await Usuario.findByPk(id, {
        attributes: { exclude: ['password_hash'] }
      });

      res.json({
        success: true,
        data: usuarioActualizado
      });
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Eliminar (desactivar) usuario
  async desactivarUsuario(req, res) {
    try {
      const { id } = req.params;

      const [updated] = await Usuario.update(
        { estatus: 'inactivo' },
        { where: { id_usuario: id } }
      );

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Usuario desactivado exitosamente'
      });
    } catch (error) {
      console.error('Error al desactivar usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  async obtenerUsuario(req, res) {
    try {
      const { id } = req.params;

      const usuario = await Usuario.findByPk(id, {
        include: [
          {
            model: Departamento,
            as: 'departamento',
            attributes: ['nombre_departamento', 'codigo_departamento']
          }
        ],
        attributes: { exclude: ['password_hash'] }
      });

      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      res.json({
        success: true,
        data: usuario
      });
    } catch (error) {
      console.error('Error al obtener el usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

}

module.exports = new UsuariosController();