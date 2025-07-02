// middleware/processFormData.js
const processFormData = (req, res, next) => {
  try {
    // Si hay items como string JSON, parsearlos
    if (req.body.items && typeof req.body.items === 'string') {
      req.body.items = JSON.parse(req.body.items)
    }
    
    // Convertir números de strings
    if (req.body.presupuesto_estimado) {
      req.body.presupuesto_estimado = parseFloat(req.body.presupuesto_estimado)
    }
    
    if (req.body.solicitante_id) {
      req.body.solicitante_id = parseInt(req.body.solicitante_id)
    }
    
    if (req.body.departamento_id) {
      req.body.departamento_id = parseInt(req.body.departamento_id)
    }
    
    // Procesar items si existen
    if (req.body.items && Array.isArray(req.body.items)) {
      req.body.items = req.body.items.map(item => ({
        ...item,
        cantidad: parseInt(item.cantidad),
        precio_estimado: parseFloat(item.precio_estimado)
      }))
    }
    
    // Agregar archivos procesados al body
    if (req.files && req.files.length > 0) {
      req.body.archivos_procesados = req.files.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path
      }))
    }
    
    next()
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Error procesando datos del formulario',
      details: error.message
    })
  }
}

module.exports = processFormData