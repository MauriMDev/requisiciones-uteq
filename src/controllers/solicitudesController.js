// ===== ARCHIVO: src/controllers/solicitudesController.js =====
const { Solicitud, Usuario, Departamento, Aprobacion } = require('../models')
const { generateFolio, calculatePagination } = require('../utils/helpers')
const logger = require('../utils/logger')

// @desc    Obtener todas las solicitudes
// @route   GET /api/solicitudes
// @access  Private
const getSolicitudes = async (req, res, next) => {
  try {
    const { page, limit, estatus, departamento_id, urgencia } = req.query
    const { limit: limitNum, offset, page: pageNum } = calculatePagination(page, limit)

    // Construir filtros
    const where = {}
    if (estatus) where.estatus = estatus
    if (departamento_id) where.departamento_id = departamento_id
    if (urgencia) where.urgencia = urgencia

    // Si no es admin, solo mostrar solicitudes de su departamento
    if (req.user.rol !== 'admin_sistema' && req.user.rol !== 'administrativo') {
      where.departamento_id = req.user.departamento_id
    }

    const { rows: solicitudes, count } = await Solicitud.findAndCountAll({
      where,
      limit: limitNum,
      offset,
      order: [['fecha_creacion', 'DESC']],
      include: [
        {
          model: Usuario,
          as: 'solicitante',
          attributes: ['nombre_completo', 'numero_empleado']
        },
        {
          model: Departamento,
          as: 'departamento',
          attributes: ['nombre_departamento', 'codigo_departamento']
        }
      ]
    })

    const totalPages = Math.ceil(count / limitNum)

    res.json({
      success: true,
      data: {
        solicitudes,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count,
          pages: totalPages
        }
      }
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Obtener solicitud por ID
// @route   GET /api/solicitudes/:id
// @access  Private
const getSolicitud = async (req, res, next) => {
  try {
    const solicitud = await Solicitud.findByPk(req.params.id, {
      include: [
        {
          model: Usuario,
          as: 'solicitante',
          attributes: ['nombre_completo', 'numero_empleado', 'correo_institucional']
        },
        {
          model: Departamento,
          as: 'departamento',
          attributes: ['nombre_departamento', 'codigo_departamento']
        },
        {
          model: Aprobacion,
          as: 'aprobaciones',
          include: [{
            model: Usuario,
            as: 'aprobador',
            attributes: ['nombre_completo', 'numero_empleado']
          }]
        }
      ]
    })

    if (!solicitud) {
      return res.status(404).json({
        success: false,
        error: 'Solicitud no encontrada'
      })
    }

    // Verificar permisos
    if (req.user.rol !== 'admin_sistema' && 
        req.user.rol !== 'administrativo' &&
        solicitud.departamento_id !== req.user.departamento_id) {
      return res.status(403).json({
        success: false,
        error: 'No autorizado para ver esta solicitud'
      })
    }

    res.json({
      success: true,
      data: { solicitud }
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Crear nueva solicitud
// @route   POST /api/solicitudes
// @access  Private
const createSolicitud = async (req, res, next) => {
  try {
    const {
      tipo_requisicion,
      descripcion_detallada,
      cantidad,
      justificacion,
      urgencia,
      presupuesto_estimado,
      comentarios_generales
    } = req.body

    // Generar folio único
    const folio_solicitud = generateFolio('SOL')

    const solicitud = await Solicitud.create({
      folio_solicitud,
      solicitante_id: req.user.id_usuario,
      departamento_id: req.user.departamento_id,
      tipo_requisicion,
      descripcion_detallada,
      cantidad,
      justificacion,
      urgencia: urgencia || 'media',
      presupuesto_estimado,
      comentarios_generales
    })

    // Obtener solicitud completa con relaciones
    const solicitudCompleta = await Solicitud.findByPk(solicitud.id_solicitud, {
      include: [
        {
          model: Usuario,
          as: 'solicitante',
          attributes: ['nombre_completo', 'numero_empleado']
        },
        {
          model: Departamento,
          as: 'departamento',
          attributes: ['nombre_departamento', 'codigo_departamento']
        }
      ]
    })

    logger.info(`Nueva solicitud creada: ${folio_solicitud} por ${req.user.correo_institucional}`)

    res.status(201).json({
      success: true,
      message: 'Solicitud creada exitosamente',
      data: { solicitud: solicitudCompleta }
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Actualizar solicitud
// @route   PUT /api/solicitudes/:id
// @access  Private
const updateSolicitud = async (req, res, next) => {
  try {
    const solicitud = await Solicitud.findByPk(req.params.id)

    if (!solicitud) {
      return res.status(404).json({
        success: false,
        error: 'Solicitud no encontrada'
      })
    }

    // Verificar permisos - solo el solicitante o admin puede editar
    if (req.user.rol !== 'admin_sistema' && 
        solicitud.solicitante_id !== req.user.id_usuario) {
      return res.status(403).json({
        success: false,
        error: 'No autorizado para editar esta solicitud'
      })
    }

    // No permitir edición si ya está en proceso
    if (['aprobada', 'en_proceso', 'completada'].includes(solicitud.estatus)) {
      return res.status(400).json({
        success: false,
        error: 'No se puede editar una solicitud que ya está en proceso'
      })
    }

    const solicitudActualizada = await solicitud.update(req.body)

    logger.info(`Solicitud actualizada: ${solicitud.folio_solicitud}`)

    res.json({
      success: true,
      message: 'Solicitud actualizada exitosamente',
      data: { solicitud: solicitudActualizada }
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Eliminar solicitud
// @route   DELETE /api/solicitudes/:id
// @access  Private
const deleteSolicitud = async (req, res, next) => {
  try {
    const solicitud = await Solicitud.findByPk(req.params.id)

    if (!solicitud) {
      return res.status(404).json({
        success: false,
        error: 'Solicitud no encontrada'
      })
    }

    // Verificar permisos
    if (req.user.rol !== 'admin_sistema' && 
        solicitud.solicitante_id !== req.user.id_usuario) {
      return res.status(403).json({
        success: false,
        error: 'No autorizado para eliminar esta solicitud'
      })
    }

    // Solo permitir eliminación si está pendiente
    if (solicitud.estatus !== 'pendiente') {
      return res.status(400).json({
        success: false,
        error: 'Solo se pueden eliminar solicitudes pendientes'
      })
    }

    await solicitud.destroy()

    logger.info(`Solicitud eliminada: ${solicitud.folio_solicitud}`)

    res.json({
      success: true,
      message: 'Solicitud eliminada exitosamente'
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getSolicitudes,
  getSolicitud,
  createSolicitud,
  updateSolicitud,
  deleteSolicitud
}