// ===== ARCHIVO: src/routes/departamentosRoutes.js =====
const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const DepartamentosController = require('../controllers/departamentosController');

const router = express.Router();

router.use(protect);

// GET /api/departamentos
router.get('/', DepartamentosController.obtenerDepartamentos);

module.exports = router;
