// ===== ARCHIVO: src/routes/usuariosRoutes.js =====
const express = require('express')
const { protect, authorize } = require('../middleware/authMiddleware')

const usuariosController = require('../controllers/usuariosController');

const router = express.Router()

// Todas las rutas requieren autenticación
router.use(protect)

// Placeholder para controladores de usuarios
// router.get('/', authorize('admin_sistema', 'administrativo'), (req, res) => {
//   res.json({ message: 'Ruta de usuarios - pendiente implementación' })
// })

// router.post('/', authorize('admin_sistema'), validateUsuario, (req, res) => {
//   res.json({ message: 'Crear usuario - pendiente implementación' })
// })

router.route('/')
  .get(authorize('admin_sistema'), usuariosController.obtenerUsuarios)
  .post(authorize('admin_sistema'), usuariosController.crearUsuario);

router.route('/:id')
  .get(authorize('admin_sistema'), usuariosController.obtenerUsuario)
  .put(authorize('admin_sistema'), usuariosController.actualizarUsuario)
  .delete(authorize('admin_sistema'), usuariosController.desactivarUsuario);

module.exports = router
