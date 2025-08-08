// ===== ARCHIVO: src/controllers/comprasController.js - CON ARCHIVOS ADJUNTOS =====
const { Op } = require('sequelize')
const fs = require('fs').promises
const path = require('path')
const {
  Solicitud,
  Usuario,
  Departamento,
  Compra,
  Factura,
  DocumentoAdjunto,
  sequelize,
} = require('../models')

class ComprasController {
  // Crear nueva compra
  async crearCompra(req, res) {
    const transaction = await sequelize.transaction()
    try {
      const {
        solicitud_id,
        proveedor_seleccionado,
        monto_total,
        fecha_compra,
        fecha_entrega_estimada,
        terminos_entrega,
        observaciones,
        facturas = [],
      } = req.body

      // Validaciones básicas
      if (!proveedor_seleccionado || !monto_total || !fecha_compra) {
        await transaction.rollback()
        return res.status(400).json({
          success: false,
          message:
            'Nombre de proveedor, monto total y fecha de compra son campos requeridos',
        })
      }

      // Procesar archivos subidos (ya procesados por el middleware)
      let archivos_adjuntos = []
      if (
        req.body.archivos_procesados &&
        req.body.archivos_procesados.length > 0
      ) {
        archivos_adjuntos = req.body.archivos_procesados.map((file) => ({
          nombre_original: file.originalname,
          nombre_archivo: file.filename,
          ruta_archivo: file.path,
          tamaño: file.size,
          tipo_mime: file.mimetype,
          fecha_subida: new Date(),
        }))
      }

      // Generar número de orden único
      const ultimaCompra = await sequelize.query(
        `
                SELECT COALESCE(MAX(CAST(SUBSTRING(numero_orden FROM '[0-9]+$') AS INTEGER)), 0) + 1 as siguiente_numero
                FROM compras 
                WHERE numero_orden ~ '^COM-[0-9]+$'
            `,
        {
          type: sequelize.QueryTypes.SELECT,
          transaction,
        }
      )

      const numero_orden = `COM-${String(ultimaCompra[0].siguiente_numero).padStart(6, '0')}`

      // Crear la compra
      const nuevaCompra = await Compra.create(
        {
          numero_orden,
          solicitud_id: solicitud_id || null,
          proveedor_seleccionado,
          monto_total,
          fecha_compra,
          fecha_entrega_estimada,
          terminos_entrega,
          observaciones,
          archivos_adjuntos, // ← AQUÍ SE GUARDAN LOS ARCHIVOS
          estatus: 'ordenada',
          creado_por: req.user.id_usuario,
        },
        { transaction }
      )

      // Procesar facturas si existen
      if (facturas && facturas.length > 0) {
        for (const factura of facturas) {
          await Factura.create(
            {
              compra_id: nuevaCompra.id_compra,
              folio_fiscal: factura.folio_fiscal || `FAC-${Date.now()}`,
              monto_factura: factura.monto_factura || monto_total,
              iva: factura.iva || 0,
              total_factura: factura.total_factura || monto_total,
              fecha_factura: factura.fecha_factura || fecha_compra,
              estatus: 'pendiente',
            },
            { transaction }
          )
        }
      }

      await transaction.commit()

      res.status(201).json({
        success: true,
        message: 'Compra creada exitosamente',
        data: {
          id_compra: nuevaCompra.id_compra,
          numero_orden: nuevaCompra.numero_orden,
          proveedor_seleccionado: nuevaCompra.proveedor_seleccionado,
          monto_total: nuevaCompra.monto_total,
          fecha_compra: nuevaCompra.fecha_compra,
          fecha_entrega_estimada: nuevaCompra.fecha_entrega_estimada,
          archivos_adjuntos: nuevaCompra.archivos_adjuntos,
          estatus: nuevaCompra.estatus,
          fecha_creacion: nuevaCompra.fecha_creacion,
        },
      })
    } catch (error) {
      await transaction.rollback()
      console.error('Error al crear compra:', error)

      // Limpiar archivos subidos si hay error
      if (
        req.body.archivos_procesados &&
        req.body.archivos_procesados.length > 0
      ) {
        try {
          await Promise.all(
            req.body.archivos_procesados.map((file) =>
              fs.unlink(file.path).catch(console.error)
            )
          )
        } catch (cleanupError) {
          console.error('Error al limpiar archivos:', cleanupError)
        }
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  // Obtener todas las compras con filtros
  async obtenerCompras(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        estatus,
        fecha_inicio,
        fecha_fin,
        search,
      } = req.query

      const offset = (page - 1) * limit

      // Construir condiciones WHERE
      const whereConditions = {}

      if (estatus) whereConditions.estatus = estatus

      // Filtros de fecha
      if (fecha_inicio || fecha_fin) {
        whereConditions.fecha_compra = {}
        if (fecha_inicio) {
          whereConditions.fecha_compra[Op.gte] = new Date(fecha_inicio)
        }
        if (fecha_fin) {
          const fechaFin = new Date(fecha_fin)
          fechaFin.setHours(23, 59, 59, 999)
          whereConditions.fecha_compra[Op.lte] = fechaFin
        }
      }

      // Búsqueda de texto
      if (search) {
        whereConditions[Op.or] = [
          { numero_orden: { [Op.iLike]: `%${search}%` } },
          { proveedor_seleccionado: { [Op.iLike]: `%${search}%` } },
        ]
      }

      // Consulta principal con Sequelize
      const { count, rows: compras } = await Compra.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: Solicitud,
            as: 'solicitud',
            attributes: ['folio_solicitud', 'descripcion_detallada'],
            required: false,
          },
          {
            model: Usuario,
            as: 'creador',
            attributes: ['nombre_completo', 'numero_empleado'],
          },
        ],
        order: [['fecha_compra', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
        distinct: true,
      })

      // Procesar datos para incluir información de archivos
      const comprasConArchivos = compras.map((compra) => {
        const compraData = compra.toJSON()
        return {
          ...compraData,
          total_archivos: compraData.archivos_adjuntos?.length || 0,
          tiene_archivos: (compraData.archivos_adjuntos?.length || 0) > 0,
        }
      })

      res.json({
        success: true,
        data: comprasConArchivos,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit),
        },
      })
    } catch (error) {
      console.error('Error al obtener compras:', error)
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      })
    }
  }

  // Obtener compra por ID
  async obtenerCompraPorId(req, res) {
    try {
      const { id } = req.params

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de compra no válido',
        })
      }

      const compra = await Compra.findOne({
        where: { id_compra: id },
        include: [
          {
            model: Solicitud,
            as: 'solicitud',
            attributes: [
              'folio_solicitud',
              'descripcion_detallada',
              'presupuesto_estimado',
            ],
            required: false,
          },
          {
            model: Usuario,
            as: 'creador',
            attributes: [
              'nombre_completo',
              'numero_empleado',
              'correo_institucional',
            ],
          },
          {
            model: Factura,
            as: 'facturas',
            attributes: [
              'id_factura',
              'folio_fiscal',
              'monto_factura',
              'total_factura',
              'fecha_factura',
              'estatus',
            ],
          },
        ],
      })

      if (!compra) {
        return res.status(404).json({
          success: false,
          message: 'Compra no encontrada',
        })
      }

      const compraData = compra.toJSON()

      res.json({
        success: true,
        data: {
          ...compraData,
          total_archivos: compraData.archivos_adjuntos?.length || 0,
          tiene_archivos: (compraData.archivos_adjuntos?.length || 0) > 0,
        },
      })
    } catch (error) {
      console.error('Error al obtener compra:', error)
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      })
    }
  }

  // Actualizar compra
  async actualizarCompra(req, res) {
    const transaction = await sequelize.transaction()
    try {
      const { id } = req.params
      const {
        proveedor_seleccionado,
        monto_total,
        fecha_entrega_estimada,
        terminos_entrega,
        observaciones,
        estatus,
        archivos_a_eliminar, // Array de nombres de archivos a eliminar
      } = req.body

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de compra no válido',
        })
      }

      // Verificar que la compra existe
      const compra = await Compra.findByPk(id, { transaction })

      if (!compra) {
        await transaction.rollback()
        return res.status(404).json({
          success: false,
          message: 'Compra no encontrada',
        })
      }

      // Procesar archivos existentes
      let archivos_adjuntos = compra.archivos_adjuntos || []

      // Eliminar archivos si se solicita
      if (archivos_a_eliminar && Array.isArray(archivos_a_eliminar)) {
        // Filtrar archivos que NO están en la lista de eliminación
        const archivosAMantener = archivos_adjuntos.filter(
          (archivo) => !archivos_a_eliminar.includes(archivo.nombre_archivo)
        )

        // Eliminar archivos del sistema de archivos
        const archivosAEliminar = archivos_adjuntos.filter((archivo) =>
          archivos_a_eliminar.includes(archivo.nombre_archivo)
        )

        await Promise.all(
          archivosAEliminar.map((archivo) =>
            fs.unlink(archivo.ruta_archivo).catch(console.error)
          )
        )

        archivos_adjuntos = archivosAMantener
      }

      // Agregar nuevos archivos si existen (ya procesados por middleware)
      if (
        req.body.archivos_procesados &&
        req.body.archivos_procesados.length > 0
      ) {
        const nuevosArchivos = req.body.archivos_procesados.map((file) => ({
          nombre_original: file.originalname,
          nombre_archivo: file.filename,
          ruta_archivo: file.path,
          tamaño: file.size,
          tipo_mime: file.mimetype,
          fecha_subida: new Date(),
        }))

        archivos_adjuntos = [...archivos_adjuntos, ...nuevosArchivos]
      }

      // Construir objeto de actualización
      const updateData = {}

      if (proveedor_seleccionado !== undefined)
        updateData.proveedor_seleccionado = proveedor_seleccionado
      if (monto_total !== undefined) updateData.monto_total = monto_total
      if (fecha_entrega_estimada !== undefined)
        updateData.fecha_entrega_estimada = fecha_entrega_estimada
      if (terminos_entrega !== undefined)
        updateData.terminos_entrega = terminos_entrega
      if (observaciones !== undefined) updateData.observaciones = observaciones
      if (estatus !== undefined) updateData.estatus = estatus

      // Actualizar archivos
      updateData.archivos_adjuntos = archivos_adjuntos

      if (Object.keys(updateData).length === 0) {
        await transaction.rollback()
        return res.status(400).json({
          success: false,
          message: 'No se proporcionaron campos para actualizar',
        })
      }

      // Actualizar la compra
      await compra.update(updateData, { transaction })

      await transaction.commit()

      res.json({
        success: true,
        message: 'Compra actualizada exitosamente',
        data: compra.toJSON(),
      })
    } catch (error) {
      await transaction.rollback()
      console.error('Error al actualizar compra:', error)

      // Limpiar archivos subidos si hay error
      if (
        req.body.archivos_procesados &&
        req.body.archivos_procesados.length > 0
      ) {
        try {
          await Promise.all(
            req.body.archivos_procesados.map((file) =>
              fs.unlink(file.path).catch(console.error)
            )
          )
        } catch (cleanupError) {
          console.error('Error al limpiar archivos:', cleanupError)
        }
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      })
    }
  }

  // Función para descargar archivos de compras
  async descargarArchivo(req, res) {
    try {
      const { id, nombreArchivo } = req.params

      // Verificar que la compra existe
      const compra = await Compra.findByPk(id)

      if (!compra) {
        return res.status(404).json({
          success: false,
          message: 'Compra no encontrada',
        })
      }

      // Buscar el archivo en los archivos adjuntos
      const archivo = compra.archivos_adjuntos?.find(
        (arch) => arch.nombre_archivo === nombreArchivo
      )

      if (!archivo) {
        return res.status(404).json({
          success: false,
          message: 'Archivo no encontrado',
        })
      }

      // Verificar que el archivo existe físicamente
      try {
        await fs.access(archivo.ruta_archivo)
      } catch (error) {
        return res.status(404).json({
          success: false,
          message: 'Archivo no encontrado en el sistema',
        })
      }

      // Configurar headers para descarga
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${archivo.nombre_original}"`
      )
      res.setHeader('Content-Type', archivo.tipo_mime)

      // Enviar archivo
      res.sendFile(path.resolve(archivo.ruta_archivo))
    } catch (error) {
      console.error('Error al descargar archivo:', error)
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      })
    }
  }

  // Eliminar compra
  async eliminarCompra(req, res) {
    const transaction = await sequelize.transaction()

    try {
      const { id } = req.params
      const { confirmacion, motivo_eliminacion } = req.body

      // Validar parámetros
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de compra no válido',
        })
      }

      // Requerir confirmación explícita
      if (!confirmacion || confirmacion !== 'ELIMINAR') {
        return res.status(400).json({
          success: false,
          message:
            'Se requiere confirmación explícita. Envía confirmacion: "ELIMINAR" en el body.',
        })
      }

      // Verificar que la compra existe
      const compra = await Compra.findByPk(id, {
        include: [
          {
            model: Solicitud,
            as: 'solicitud',
            attributes: ['folio_solicitud', 'descripcion_detallada'],
          },
          {
            model: Usuario,
            as: 'creador',
            attributes: ['nombre_completo', 'correo_institucional'],
          },
          {
            model: Factura,
            as: 'facturas',
            attributes: ['id_factura', 'folio_fiscal', 'estatus'],
          },
        ],
        transaction,
      })

      if (!compra) {
        await transaction.rollback()
        return res.status(404).json({
          success: false,
          message: 'Compra no encontrada',
        })
      }

      // Control de permisos para eliminación de compras
      const puedeEliminar =
        // Admin sistema siempre puede eliminar
        req.user.rol === 'admin_sistema' ||
        // Administrativo puede eliminar compras no entregadas
        (req.user.rol === 'administrativo' &&
          !['entregada'].includes(compra.estatus)) ||
        // Aprobador puede eliminar compras no entregadas
        (req.user.rol === 'aprobador' &&
          !['entregada'].includes(compra.estatus)) ||
        // El creador puede eliminar compras ordenadas únicamente
        (compra.creado_por === req.user.id_usuario &&
          compra.estatus === 'ordenada')

      if (!puedeEliminar) {
        await transaction.rollback()
        return res.status(403).json({
          success: false,
          message:
            'No tienes permisos para eliminar esta compra. Solo se pueden eliminar compras ordenadas por el creador, o por administradores.',
        })
      }

      // Verificar restricciones por estado
      if (compra.estatus === 'entregada') {
        await transaction.rollback()
        return res.status(400).json({
          success: false,
          message:
            'No se pueden eliminar compras ya entregadas. Contacta al administrador si es necesario.',
        })
      }

      // Si la compra tiene facturas, requerir rol administrativo
      if (compra.facturas && compra.facturas.length > 0) {
        const rolesAdministrativos = ['admin_sistema', 'administrativo']
        if (!rolesAdministrativos.includes(req.user.rol)) {
          await transaction.rollback()
          return res.status(400).json({
            success: false,
            message:
              'Esta compra tiene facturas asociadas y solo puede ser eliminada por un administrador.',
          })
        }
      }

      // Guardar información de la compra para el log
      const infoCompra = {
        numero_orden: compra.numero_orden,
        proveedor: compra.proveedor_seleccionado,
        monto_total: compra.monto_total,
        estatus: compra.estatus,
        fecha_compra: compra.fecha_compra,
        solicitud_relacionada:
          compra.solicitud?.folio_solicitud || 'Sin solicitud',
        eliminado_por: req.user.nombre_completo,
        motivo: motivo_eliminacion || 'Sin motivo especificado',
        fecha_eliminacion: new Date(),
      }

      // Eliminar archivos físicos asociados
      const archivosEliminados = []
      if (compra.archivos_adjuntos && compra.archivos_adjuntos.length > 0) {
        for (const archivo of compra.archivos_adjuntos) {
          try {
            await fs.unlink(archivo.ruta_archivo)
            archivosEliminados.push(archivo.nombre_original)
          } catch (error) {
            console.error(
              `Error al eliminar archivo ${archivo.nombre_original}:`,
              error
            )
            // Continuamos aunque falle la eliminación del archivo
          }
        }
      }

      // Eliminar facturas relacionadas primero (debido a foreign keys)
      if (compra.facturas && compra.facturas.length > 0) {
        await Factura.destroy({
          where: { compra_id: id },
          transaction,
        })
      }

      // Eliminar la compra
      await compra.destroy({ transaction })

      // Registrar la eliminación en logs
      console.log('Compra eliminada:', JSON.stringify(infoCompra, null, 2))

      await transaction.commit()

      res.json({
        success: true,
        message: 'Compra eliminada exitosamente',
        data: {
          compra_eliminada: {
            numero_orden: infoCompra.numero_orden,
            eliminado_por: infoCompra.eliminado_por,
            fecha_eliminacion: infoCompra.fecha_eliminacion,
            archivos_eliminados: archivosEliminados,
            facturas_eliminadas: compra.facturas?.length || 0,
            motivo: infoCompra.motivo,
            solicitud_relacionada: infoCompra.solicitud_relacionada,
          },
        },
      })
    } catch (error) {
      await transaction.rollback()
      console.error('Error al eliminar compra:', error)

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  // Agregar factura a compra (con archivos)
  async agregarFactura(req, res) {
    const transaction = await sequelize.transaction()
    try {
      const { id } = req.params
      const { folio_fiscal, monto_factura, iva, total_factura, fecha_factura } =
        req.body

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de compra no válido',
        })
      }

      // Verificar que la compra existe
      const compra = await Compra.findByPk(id, { transaction })

      if (!compra) {
        await transaction.rollback()
        return res.status(404).json({
          success: false,
          message: 'Compra no encontrada',
        })
      }

      // Procesar archivos de la factura si existen
      let archivos_factura = []
      if (
        req.body.archivos_procesados &&
        req.body.archivos_procesados.length > 0
      ) {
        archivos_factura = req.body.archivos_procesados.map((file) => ({
          nombre_original: file.originalname,
          nombre_archivo: file.filename,
          ruta_archivo: file.path,
          tamaño: file.size,
          tipo_mime: file.mimetype,
          fecha_subida: new Date(),
        }))
      }

      // Crear la factura
      const nuevaFactura = await Factura.create(
        {
          compra_id: id,
          folio_fiscal: folio_fiscal || `FAC-${Date.now()}`,
          monto_factura: monto_factura || compra.monto_total,
          iva: iva || 0,
          total_factura: total_factura || monto_factura || compra.monto_total,
          fecha_factura: fecha_factura || new Date(),
          archivos_adjuntos: archivos_factura, // Guardar archivos de la factura
          estatus: 'pendiente',
        },
        { transaction }
      )

      await transaction.commit()

      res.status(201).json({
        success: true,
        message: 'Factura agregada exitosamente',
        data: {
          ...nuevaFactura.toJSON(),
          total_archivos: archivos_factura.length,
        },
      })
    } catch (error) {
      await transaction.rollback()
      console.error('Error al agregar factura:', error)

      // Limpiar archivos subidos si hay error
      if (
        req.body.archivos_procesados &&
        req.body.archivos_procesados.length > 0
      ) {
        try {
          await Promise.all(
            req.body.archivos_procesados.map((file) =>
              fs.unlink(file.path).catch(console.error)
            )
          )
        } catch (cleanupError) {
          console.error('Error al limpiar archivos:', cleanupError)
        }
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      })
    }
  }

  // Actualizar estado de factura
  async actualizarEstadoFactura(req, res) {
    const transaction = await sequelize.transaction()
    try {
      const { id, facturaId } = req.params
      const { estatus } = req.body

      if (!id || isNaN(id) || !facturaId || isNaN(facturaId)) {
        return res.status(400).json({
          success: false,
          message: 'IDs de compra y factura no válidos',
        })
      }

      // Validar estado
      const estadosValidos = ['pendiente', 'recibida', 'pagada', 'cancelada']
      if (!estatus || !estadosValidos.includes(estatus)) {
        await transaction.rollback()
        return res.status(400).json({
          success: false,
          message: 'Estado de factura no válido',
        })
      }

      // Verificar que la factura existe
      const factura = await Factura.findOne({
        where: {
          id_factura: facturaId,
          compra_id: id,
        },
        transaction,
      })

      if (!factura) {
        await transaction.rollback()
        return res.status(404).json({
          success: false,
          message: 'Factura no encontrada para esta compra',
        })
      }

      // Actualizar estado
      await factura.update({ estatus }, { transaction })

      await transaction.commit()

      res.json({
        success: true,
        message: 'Estado de factura actualizado',
        data: factura.toJSON(),
      })
    } catch (error) {
      await transaction.rollback()
      console.error('Error al actualizar estado de factura:', error)
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      })
    }
  }
}

module.exports = new ComprasController()