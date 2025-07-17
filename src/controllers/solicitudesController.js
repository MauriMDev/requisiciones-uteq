// ===== ARCHIVO: src/controllers/solicitudesController.js - CON SEQUELIZE =====
const { Op } = require('sequelize')
const {
  Solicitud,
  Usuario,
  Departamento,
  Aprobacion,
  sequelize,
} = require('../models')

class SolicitudesController {
  // Crear nueva solicitud
  async crearSolicitud(req, res) {
    console.log(req)
    const transaction = await sequelize.transaction()
    try {
      const {
        tipo_requisicion,
        descripcion_detallada,
        cantidad = 1,
        justificacion,
        urgencia = 'media',
        presupuesto_estimado,
        fecha_necesidad,
        items = [],
        comentarios_generales,
      } = req.body

      // Validaciones
      if (!tipo_requisicion || !descripcion_detallada) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de requisición y descripción son campos requeridos',
        })
      }

      // Validar enum tipo_requisicion
      const tiposValidos = ['productos', 'servicios', 'mantenimiento']
      if (!tiposValidos.includes(tipo_requisicion)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de requisición no válido',
        })
      }

      // Validar enum urgencia
      const urgenciasValidas = ['baja', 'media', 'alta', 'critica']
      if (!urgenciasValidas.includes(urgencia)) {
        return res.status(400).json({
          success: false,
          message: 'Nivel de urgencia no válido',
        })
      }

      // Generar folio único usando Sequelize
      const ultimaSolicitud = await sequelize.query(
        `
                SELECT COALESCE(MAX(CAST(SUBSTRING(folio_solicitud FROM '[0-9]+$') AS INTEGER)), 0) + 1 as siguiente_folio
                FROM solicitudes 
                WHERE folio_solicitud ~ '^REQ-[0-9]+$'
            `,
        {
          type: sequelize.QueryTypes.SELECT,
          transaction,
        }
      )

      const folio_solicitud = `REQ-${String(ultimaSolicitud[0].siguiente_folio).padStart(6, '0')}`

      // Obtener departamento del usuario solicitante usando Sequelize
      const usuario = await Usuario.findOne({
        where: {
          id_usuario: req.user.id_usuario,
          estatus: 'activo',
        },
        attributes: ['departamento_id'],
        transaction,
      })

      if (!usuario) {
        await transaction.rollback()
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado o inactivo',
        })
      }

      // Crear solicitud usando Sequelize
      const nuevaSolicitud = await Solicitud.create(
        {
          folio_solicitud,
          solicitante_id: req.user.id_usuario,
          departamento_id: usuario.departamento_id,
          tipo_requisicion,
          descripcion_detallada,
          cantidad,
          justificacion,
          urgencia,
          presupuesto_estimado,
          fecha_necesidad,
          items,
          comentarios_generales,
        },
        { transaction }
      )

      await transaction.commit()

      res.status(201).json({
        success: true,
        message: 'Solicitud creada exitosamente',
        data: {
          id_solicitud: nuevaSolicitud.id_solicitud,
          folio_solicitud: nuevaSolicitud.folio_solicitud,
          tipo_requisicion: nuevaSolicitud.tipo_requisicion,
          descripcion_detallada: nuevaSolicitud.descripcion_detallada,
          cantidad: nuevaSolicitud.cantidad,
          urgencia: nuevaSolicitud.urgencia,
          presupuesto_estimado: nuevaSolicitud.presupuesto_estimado,
          fecha_necesidad: nuevaSolicitud.fecha_necesidad,
          estatus: nuevaSolicitud.estatus,
          fecha_creacion: nuevaSolicitud.fecha_creacion,
        },
      })
    } catch (error) {
      await transaction.rollback()
      console.error('Error al crear solicitud:', error)
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  // Obtener todas las solicitudes con filtros
  async obtenerSolicitudes(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        estatus,
        tipo_requisicion,
        urgencia,
        fecha_inicio,
        fecha_fin,
        departamento_id,
        solicitante_id,
        search,
      } = req.query

      const offset = (page - 1) * limit

      // Construir condiciones WHERE dinámicamente
      const whereConditions = {}

      if (estatus) whereConditions.estatus = estatus
      if (tipo_requisicion) whereConditions.tipo_requisicion = tipo_requisicion
      if (urgencia) whereConditions.urgencia = urgencia
      if (departamento_id) whereConditions.departamento_id = departamento_id
      if (solicitante_id) whereConditions.solicitante_id = solicitante_id

      // Filtros de fecha
      if (fecha_inicio || fecha_fin) {
        whereConditions.fecha_creacion = {}
        if (fecha_inicio) {
          whereConditions.fecha_creacion[Op.gte] = new Date(fecha_inicio)
        }
        if (fecha_fin) {
          const fechaFin = new Date(fecha_fin)
          fechaFin.setHours(23, 59, 59, 999) // Incluir todo el día
          whereConditions.fecha_creacion[Op.lte] = fechaFin
        }
      }

      // Búsqueda de texto
      if (search) {
        whereConditions[Op.or] = [
          { folio_solicitud: { [Op.iLike]: `%${search}%` } },
          { descripcion_detallada: { [Op.iLike]: `%${search}%` } },
        ]
      }

      // Control de acceso según rol del usuario
      if (req.user.rol === 'solicitante') {
        whereConditions.solicitante_id = req.user.id_usuario
      } else if (req.user.rol === 'aprobador') {
        // Obtener departamento del usuario
        const usuario = await Usuario.findByPk(req.user.id_usuario, {
          attributes: ['departamento_id'],
        })
        if (usuario) {
          whereConditions.departamento_id = usuario.departamento_id
        }
      }
      // admin_sistema y administrativo pueden ver todas

      // Consulta principal con Sequelize
      const { count, rows: solicitudes } = await Solicitud.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: Usuario,
            as: 'solicitante',
            attributes: ['nombre_completo', 'numero_empleado'],
          },
          {
            model: Departamento,
            as: 'departamento',
            attributes: ['nombre_departamento', 'codigo_departamento'],
          },
          {
            model: Aprobacion,
            as: 'aprobaciones',
            attributes: ['accion'],
            required: false,
          },
        ],
        order: [['fecha_creacion', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
        distinct: true, // Para contar correctamente con las asociaciones
      })

      // Procesar datos para incluir contadores de aprobaciones
      const solicitudesConContadores = solicitudes.map((solicitud) => {
        const solicitudData = solicitud.toJSON()
        const totalAprobaciones = solicitudData.aprobaciones.length
        const aprobacionesPositivas = solicitudData.aprobaciones.filter(
          (a) => a.accion === 'aprobar'
        ).length

        return {
          id_solicitud: solicitudData.id_solicitud,
          folio_solicitud: solicitudData.folio_solicitud,
          tipo_requisicion: solicitudData.tipo_requisicion,
          descripcion_detallada: solicitudData.descripcion_detallada,
          cantidad: solicitudData.cantidad,
          urgencia: solicitudData.urgencia,
          presupuesto_estimado: solicitudData.presupuesto_estimado,
          fecha_necesidad: solicitudData.fecha_necesidad,
          estatus: solicitudData.estatus,
          fecha_creacion: solicitudData.fecha_creacion,
          fecha_actualizacion: solicitudData.fecha_actualizacion,
          solicitante_nombre: solicitudData.solicitante.nombre_completo,
          numero_empleado: solicitudData.solicitante.numero_empleado,
          nombre_departamento: solicitudData.departamento.nombre_departamento,
          codigo_departamento: solicitudData.departamento.codigo_departamento,
          total_aprobaciones: totalAprobaciones,
          aprobaciones_positivas: aprobacionesPositivas,
        }
      })

      res.json({
        success: true,
        data: solicitudesConContadores,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit),
        },
      })
    } catch (error) {
      console.error('Error al obtener solicitudes:', error)
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      })
    }
  }

  // Obtener solicitud por ID
  async obtenerSolicitudPorId(req, res) {
    try {
      const { id } = req.params

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de solicitud no válido',
        })
      }

      const solicitud = await Solicitud.findOne({
        where: { id_solicitud: id },
        include: [
          {
            model: Usuario,
            as: 'solicitante',
            attributes: [
              'nombre_completo',
              'numero_empleado',
              'correo_institucional',
              'telefono',
            ],
          },
          {
            model: Departamento,
            as: 'departamento',
            attributes: ['nombre_departamento', 'codigo_departamento'],
          },
        ],
      })

      if (!solicitud) {
        return res.status(404).json({
          success: false,
          message: 'Solicitud no encontrada',
        })
      }

      // Control de acceso
      if (
        req.user.rol === 'solicitante' &&
        solicitud.solicitante_id !== req.user.id_usuario
      ) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver esta solicitud',
        })
      }

      // Obtener aprobaciones relacionadas
      const aprobaciones = await Aprobacion.findAll({
        where: { solicitud_id: id },
        include: [
          {
            model: Usuario,
            as: 'aprobador',
            attributes: ['nombre_completo', 'numero_empleado'],
          },
        ],
        order: [['fecha_accion', 'DESC']],
      })

      const solicitudData = solicitud.toJSON()
      const aprobacionesData = aprobaciones.map((aprobacion) => ({
        ...aprobacion.toJSON(),
        aprobador_nombre: aprobacion.aprobador.nombre_completo,
        aprobador_numero: aprobacion.aprobador.numero_empleado,
      }))

      res.json({
        success: true,
        data: {
          ...solicitudData,
          solicitante_nombre: solicitudData.solicitante.nombre_completo,
          numero_empleado: solicitudData.solicitante.numero_empleado,
          correo_institucional: solicitudData.solicitante.correo_institucional,
          telefono: solicitudData.solicitante.telefono,
          nombre_departamento: solicitudData.departamento.nombre_departamento,
          codigo_departamento: solicitudData.departamento.codigo_departamento,
          aprobaciones: aprobacionesData,
        },
      })
    } catch (error) {
      console.error('Error al obtener solicitud:', error)
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      })
    }
  }

  // Actualizar solicitud
  async actualizarSolicitud(req, res) {
    const transaction = await sequelize.transaction()
    try {
      const { id } = req.params
      const {
        tipo_requisicion,
        descripcion_detallada,
        cantidad,
        justificacion,
        urgencia,
        presupuesto_estimado,
        fecha_necesidad,
        items,
        comentarios_generales,
      } = req.body

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de solicitud no válido',
        })
      }

      // Verificar que la solicitud existe y el usuario tiene permisos
      const solicitud = await Solicitud.findByPk(id, { transaction })

      if (!solicitud) {
        await transaction.rollback()
        return res.status(404).json({
          success: false,
          message: 'Solicitud no encontrada',
        })
      }

      // Solo el solicitante puede editar su solicitud si está pendiente
      if (
        req.user.rol === 'solicitante' &&
        solicitud.solicitante_id !== req.user.id_usuario
      ) {
        await transaction.rollback()
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para editar esta solicitud',
        })
      }

      // Verificar que la solicitud se puede editar
      if (!['pendiente', 'en_revision'].includes(solicitud.estatus)) {
        await transaction.rollback()
        return res.status(400).json({
          success: false,
          message: 'La solicitud no se puede editar en su estado actual',
        })
      }

      // Construir objeto de actualización dinámicamente
      const updateData = {}

      if (tipo_requisicion !== undefined)
        updateData.tipo_requisicion = tipo_requisicion
      if (descripcion_detallada !== undefined)
        updateData.descripcion_detallada = descripcion_detallada
      if (cantidad !== undefined) updateData.cantidad = cantidad
      if (justificacion !== undefined) updateData.justificacion = justificacion
      if (urgencia !== undefined) updateData.urgencia = urgencia
      if (presupuesto_estimado !== undefined)
        updateData.presupuesto_estimado = presupuesto_estimado
      if (fecha_necesidad !== undefined)
        updateData.fecha_necesidad = fecha_necesidad
      if (items !== undefined) updateData.items = items
      if (comentarios_generales !== undefined)
        updateData.comentarios_generales = comentarios_generales

      if (Object.keys(updateData).length === 0) {
        await transaction.rollback()
        return res.status(400).json({
          success: false,
          message: 'No se proporcionaron campos para actualizar',
        })
      }

      // Actualizar con Sequelize (updated_at se actualiza automáticamente)
      await solicitud.update(updateData, { transaction })

      await transaction.commit()

      res.json({
        success: true,
        message: 'Solicitud actualizada exitosamente',
        data: solicitud.toJSON(),
      })
    } catch (error) {
      await transaction.rollback()
      console.error('Error al actualizar solicitud:', error)
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      })
    }
  }

  async aprobarSolicitud(req, res) {
    const transaction = await sequelize.transaction()

    try {
      const { id } = req.params
      const { comentario } = req.body

      // Validar parámetros
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de solicitud no válido',
        })
      }

      // Verificar que la solicitud existe con sus relaciones
      const solicitud = await Solicitud.findByPk(id, {
        include: [
          {
            model: Usuario,
            as: 'solicitante',
            attributes: [
              'id_usuario',
              'nombre_completo',
              'correo_institucional',
            ],
          },
          {
            model: Aprobacion,
            as: 'aprobaciones',
            include: [
              {
                model: Usuario,
                as: 'aprobador',
                attributes: ['id_usuario', 'nombre_completo'],
              },
            ],
          },
        ],
        transaction,
      })

      if (!solicitud) {
        await transaction.rollback()
        return res.status(404).json({
          success: false,
          message: 'Solicitud no encontrada',
        })
      }

      // Verificar permisos - Solo aprobadores y administrativos pueden aprobar
      const rolesPermitidos = ['aprobador', 'administrativo', 'admin_sistema']
      if (!rolesPermitidos.includes(req.user.rol)) {
        await transaction.rollback()
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para aprobar solicitudes',
        })
      }

      // Un solicitante NO puede aprobar su propia solicitud
      if (solicitud.solicitante_id === req.user.id_usuario) {
        await transaction.rollback()
        return res.status(403).json({
          success: false,
          message: 'No puedes aprobar tu propia solicitud',
        })
      }

      // Verificar que se puede aprobar la solicitud
      const estadosAprobables = ['pendiente', 'en_revision']
      if (!estadosAprobables.includes(solicitud.estatus)) {
        await transaction.rollback()
        return res.status(400).json({
          success: false,
          message: `La solicitud no se puede aprobar en estado: ${solicitud.estatus}`,
        })
      }

      // Verificar si ya existe una aprobación de este usuario para esta solicitud
      const aprobacionExistente = await Aprobacion.findOne({
        where: {
          solicitud_id: id,
          aprobador_id: req.user.id_usuario,
          accion: 'aprobar',
        },
        transaction,
      })

      if (aprobacionExistente) {
        await transaction.rollback()
        return res.status(400).json({
          success: false,
          message: 'Ya has aprobado esta solicitud anteriormente',
        })
      }

      // Obtener configuración del sistema para aprobaciones mínimas
      const configAprobaciones = await ConfiguracionSistema.findOne({
        where: { clave_configuracion: 'requiere_aprobacion_minima' },
        transaction,
      })

      const aprobacionesMinimas = parseInt(
        configAprobaciones?.valor_configuracion || '1'
      )

      // Contar aprobaciones actuales
      const aprobacionesActuales = await Aprobacion.count({
        where: {
          solicitud_id: id,
          accion: 'aprobar',
          estatus: 'completada',
        },
        transaction,
      })

      // Crear registro de aprobación
      const nuevaAprobacion = await Aprobacion.create(
        {
          solicitud_id: id,
          aprobador_id: req.user.id_usuario,
          accion: 'aprobar',
          comentarios: comentario || 'Solicitud aprobada',
          nivel_aprobacion: aprobacionesActuales + 1,
          estatus: 'completada',
          fecha_accion: new Date(),
        },
        { transaction }
      )

      // Determinar el nuevo estatus de la solicitud
      let nuevoEstatus = 'en_revision'

      // Si ya se cumplieron las aprobaciones mínimas, marcar como aprobada
      if (aprobacionesActuales + 1 >= aprobacionesMinimas) {
        nuevoEstatus = 'aprobada'
      }

      // Actualizar la solicitud
      await solicitud.update(
        {
          estatus: nuevoEstatus,
          fecha_actualizacion: new Date(),
        },
        { transaction }
      )

      // Crear notificación para el solicitante
      await Notificacion.create(
        {
          usuario_destino: solicitud.solicitante_id,
          solicitud_id: id,
          titulo_notificacion: 'Solicitud Aprobada',
          mensaje: `Tu solicitud ${solicitud.folio_solicitud} ha sido aprobada por ${req.user.nombre_completo}`,
          tipo: 'cambio_estatus',
        },
        { transaction }
      )

      // Si la solicitud está completamente aprobada, notificar al área administrativa
      if (nuevoEstatus === 'aprobada') {
        // Buscar usuarios administrativos para notificar
        const usuariosAdministrativos = await Usuario.findAll({
          where: {
            rol: ['administrativo', 'admin_sistema'],
            estatus: 'activo',
          },
          transaction,
        })

        // Crear notificaciones para usuarios administrativos
        const notificacionesAdmin = usuariosAdministrativos.map((usuario) => ({
          usuario_destino: usuario.id_usuario,
          solicitud_id: id,
          titulo_notificacion: 'Solicitud Lista para Proceso',
          mensaje: `La solicitud ${solicitud.folio_solicitud} está aprobada y lista para continuar el proceso de compra`,
          tipo: 'nueva_solicitud',
        }))

        if (notificacionesAdmin.length > 0) {
          await Notificacion.bulkCreate(notificacionesAdmin, { transaction })
        }
      }

      // Registrar en auditoría
      await LogAuditoria.create(
        {
          usuario_id: req.user.id_usuario,
          accion_realizada: 'APROBAR_SOLICITUD',
          tabla_afectada: 'solicitudes',
          registro_afectado: id,
          datos_anteriores: { estatus: solicitud.estatus },
          datos_nuevos: {
            estatus: nuevoEstatus,
            aprobacion_id: nuevaAprobacion.id_aprobacion,
          },
          ip_usuario: req.ip,
        },
        { transaction }
      )

      await transaction.commit()

      // Respuesta exitosa
      res.json({
        success: true,
        message:
          nuevoEstatus === 'aprobada'
            ? 'Solicitud aprobada completamente y lista para proceso de compra'
            : 'Aprobación registrada exitosamente',
        data: {
          solicitud: {
            id_solicitud: solicitud.id_solicitud,
            folio_solicitud: solicitud.folio_solicitud,
            estatus: nuevoEstatus,
            aprobaciones_requeridas: aprobacionesMinimas,
            aprobaciones_actuales: aprobacionesActuales + 1,
          },
          aprobacion: {
            id_aprobacion: nuevaAprobacion.id_aprobacion,
            aprobador: req.user.nombre_completo,
            fecha_aprobacion: nuevaAprobacion.fecha_accion,
            comentarios: nuevaAprobacion.comentarios,
          },
        },
      })
    } catch (error) {
      await transaction.rollback()
      console.error('Error al aprobar solicitud:', error)
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  // Cancelar solicitud
  async cancelarSolicitud(req, res) {
    try {
      const { id } = req.params
      const { motivo_cancelacion } = req.body

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de solicitud no válido',
        })
      }

      // Verificar que la solicitud existe
      const solicitud = await Solicitud.findByPk(id)

      if (!solicitud) {
        return res.status(404).json({
          success: false,
          message: 'Solicitud no encontrada',
        })
      }
      console.log(req.user.rol)

      // Verificar permisos
      if (
        req.user.rol === 'solicitante' &&
        solicitud.solicitante_id !== req.user.id_usuario
      ) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para cancelar esta solicitud',
        })
      }

      // Verificar que se puede cancelar
      if (['completada', 'denegada'].includes(solicitud.estatus)) {
        return res.status(400).json({
          success: false,
          message: 'La solicitud no se puede cancelar en su estado actual',
        })
      }

      // Actualizar solicitud a cancelada
      const motivoTexto = motivo_cancelacion
        ? `\n\n[CANCELADA] Motivo: ${motivo_cancelacion}`
        : '\n\n[CANCELADA] Sin motivo especificado'

      const comentarios = (solicitud.comentarios_generales || '') + motivoTexto

      await solicitud.update({
        estatus: 'denegada',
        comentarios_generales: comentarios,
      })

      res.json({
        success: true,
        message: 'Solicitud cancelada exitosamente',
        data: solicitud.toJSON(),
      })
    } catch (error) {
      console.error('Error al cancelar solicitud:', error)
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      })
    }
  }

  // Obtener estadísticas de solicitudes
  async obtenerEstadisticas(req, res) {
    try {
      const { departamento_id, fecha_inicio, fecha_fin } = req.query

      // Construir condiciones WHERE
      const whereConditions = {}

      // Filtros de fecha
      if (fecha_inicio || fecha_fin) {
        whereConditions.fecha_creacion = {}
        if (fecha_inicio) {
          whereConditions.fecha_creacion[Op.gte] = new Date(fecha_inicio)
        }
        if (fecha_fin) {
          const fechaFin = new Date(fecha_fin)
          fechaFin.setHours(23, 59, 59, 999)
          whereConditions.fecha_creacion[Op.lte] = fechaFin
        }
      }

      // Control de acceso según rol
      if (req.user.rol === 'solicitante') {
        whereConditions.solicitante_id = req.user.id_usuario
      } else if (req.user.rol === 'aprobador') {
        const usuario = await Usuario.findByPk(req.user.id_usuario, {
          attributes: ['departamento_id'],
        })
        if (usuario) {
          whereConditions.departamento_id = usuario.departamento_id
        }
      } else if (
        departamento_id &&
        ['admin_sistema', 'administrativo'].includes(req.user.rol)
      ) {
        whereConditions.departamento_id = departamento_id
      }

      // Usar consulta SQL cruda para estadísticas más eficientes
      const estadisticas = await sequelize.query(
        `
                SELECT 
                    COUNT(*) as total_solicitudes,
                    COUNT(CASE WHEN estatus = 'pendiente' THEN 1 END) as pendientes,
                    COUNT(CASE WHEN estatus = 'en_revision' THEN 1 END) as en_revision,
                    COUNT(CASE WHEN estatus = 'aprobada' THEN 1 END) as aprobadas,
                    COUNT(CASE WHEN estatus = 'denegada' THEN 1 END) as denegadas,
                    COUNT(CASE WHEN estatus = 'en_proceso' THEN 1 END) as en_proceso,
                    COUNT(CASE WHEN estatus = 'completada' THEN 1 END) as completadas,
                    COUNT(CASE WHEN urgencia = 'critica' THEN 1 END) as criticas,
                    COUNT(CASE WHEN urgencia = 'alta' THEN 1 END) as altas,
                    AVG(presupuesto_estimado) as presupuesto_promedio,
                    SUM(presupuesto_estimado) as presupuesto_total
                FROM solicitudes
                WHERE ${
                  Object.keys(whereConditions).length > 0
                    ? Object.keys(whereConditions)
                        .map((key, index) => {
                          if (key === 'fecha_creacion') {
                            let condition = ''
                            if (whereConditions[key][Op.gte])
                              condition += `DATE(fecha_creacion) >= :fecha_inicio`
                            if (whereConditions[key][Op.lte])
                              condition += `${condition ? ' AND ' : ''}DATE(fecha_creacion) <= :fecha_fin`
                            return condition
                          }
                          return `${key} = :${key}`
                        })
                        .join(' AND ')
                    : '1=1'
                }
            `,
        {
          type: sequelize.QueryTypes.SELECT,
          replacements: {
            ...whereConditions,
            fecha_inicio: fecha_inicio,
            fecha_fin: fecha_fin,
            departamento_id: departamento_id,
            solicitante_id:
              req.user.rol === 'solicitante' ? req.user.id_usuario : undefined,
          },
        }
      )

      res.json({
        success: true,
        data: estadisticas[0],
      })
    } catch (error) {
      console.error('Error al obtener estadísticas:', error)
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      })
    }
  }
}

module.exports = new SolicitudesController()
