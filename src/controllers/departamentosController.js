// ===== ARCHIVO: src/controllers/DepartamentosController.js =====
const { Departamento } = require('../models');

class DepartamentosController {
  // Obtener todos los departamentos activos
  async obtenerDepartamentos(req, res) {
    try {
      const departamentos = await Departamento.findAll({
        where: { estatus: 'activo' },
        attributes: ['id_departamento', 'nombre_departamento', 'codigo_departamento'],
        order: [['nombre_departamento', 'ASC']]
      });

      res.json({
        success: true,
        data: departamentos
      });
    } catch (error) {
      console.error('Error al obtener departamentos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

module.exports = new DepartamentosController();
