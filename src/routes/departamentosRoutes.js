// ===== ARCHIVO: src/routes/departamentosRoutes.js =====
const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const departamentosController = require('../controllers/departamentosController');

const router = express.Router();

router.use(protect);

// GET /api/departamentos
router.get('/', departamentosController.obtenerDepartamentos);

module.exports = router;