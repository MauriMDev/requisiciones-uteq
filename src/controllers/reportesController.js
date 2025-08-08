// src/controllers/reportesController.js
const {
  Solicitud,
  Compra,
  Departamento,
  Proveedor,
  Usuario,
  Cotizacion,
  Aprobacion,
  Factura,
  sequelize,
} = require('../models')
const { Op, fn, col, literal } = require('sequelize')
const ExcelJS = require('exceljs')
const PDFDocument = require('pdfkit')

// ===== REPORTES DE COMPRAS =====

// 1. Reporte de compras por período
const getReporteComprasPeriodo = async (req, res) => {
  try {
    const {
      fecha_inicio,
      fecha_fin,
      departamento_id,
      proveedor_id,
      estatus,
      periodo = 'mensual',
    } = req.query

    const whereConditions = {
      fecha_compra: {
        [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)],
      },
    }

    if (departamento_id) {
      whereConditions['$solicitud.departamento_id$'] = parseInt(departamento_id)
    }
    if (proveedor_id) {
      whereConditions.proveedor_seleccionado = proveedor_id // Como string
    }
    if (estatus) whereConditions.estatus = estatus

    // ⭐ CONSULTA SIN INCLUDE DE PROVEEDOR (evita el error de tipos)
    const comprasRaw = await Compra.findAll({
      where: whereConditions,
      include: [
        {
          model: Solicitud,
          as: 'solicitud',
          include: [
            {
              model: Departamento,
              as: 'departamento',
              attributes: ['nombre_departamento'],
            },
            {
              model: Usuario,
              as: 'solicitante',
              attributes: ['nombre_completo'],
            },
          ],
        },
        // ❌ NO incluir Proveedor aquí
      ],
      order: [['fecha_compra', 'DESC']],
    })

    // ⭐ OBTENER NOMBRES DE PROVEEDORES MANUALMENTE
    let proveedorMap = {}

    if (comprasRaw.length > 0) {
      // Obtener IDs únicos de proveedores
      const proveedorIds = [
        ...new Set(comprasRaw.map((c) => c.proveedor_seleccionado)),
      ]

      // Filtrar IDs válidos (no null/undefined)
      const proveedorIdsValidos = proveedorIds.filter(
        (id) => id && id.toString().trim() !== ''
      )

      if (proveedorIdsValidos.length > 0) {
        // Usar consulta SQL raw para evitar problemas de tipos
        const rawQuery = `
          SELECT id_proveedor, nombre_proveedor 
          FROM proveedores 
          WHERE id_proveedor::VARCHAR IN (${proveedorIdsValidos.map((id) => `'${id}'`).join(',')})
        `

        try {
          const proveedores = await sequelize.query(rawQuery, {
            type: sequelize.QueryTypes.SELECT,
          })

          // Crear mapa para lookup rápido
          proveedores.forEach((p) => {
            proveedorMap[p.id_proveedor.toString()] = p.nombre_proveedor
          })
        } catch (proveedorError) {
          console.warn(
            'Error al obtener nombres de proveedores:',
            proveedorError.message
          )
          // Continuar sin nombres de proveedores
        }
      }
    }

    // ⭐ COMBINAR DATOS MANUALMENTE
    const compras = comprasRaw.map((c) => ({
      id_compra: c.id_compra,
      numero_orden: c.numero_orden,
      proveedor:
        proveedorMap[c.proveedor_seleccionado] ||
        `Proveedor ID: ${c.proveedor_seleccionado}`,
      departamento: c.solicitud?.departamento?.nombre_departamento,
      solicitante: c.solicitud?.solicitante?.nombre_completo,
      fecha_compra: c.fecha_compra,
      monto_total: parseFloat(c.monto_total),
      estatus: c.estatus,
    }))

    // Agrupación por período (sin include problemático)
    let formatoPeriodo
    switch (periodo) {
      case 'diario':
        formatoPeriodo = 'YYYY-MM-DD'
        break
      case 'semanal':
        formatoPeriodo = 'YYYY-WW'
        break
      case 'mensual':
        formatoPeriodo = 'YYYY-MM'
        break
      case 'anual':
        formatoPeriodo = 'YYYY'
        break
      default:
        formatoPeriodo = 'YYYY-MM'
    }

    const tendenciaPeriodo = await Compra.findAll({
      where: whereConditions,
      attributes: [
        [fn('to_char', col('fecha_compra'), formatoPeriodo), 'periodo'],
        [fn('COUNT', col('id_compra')), 'cantidad_compras'],
        [fn('SUM', col('monto_total')), 'monto_total'],
        [fn('AVG', col('monto_total')), 'promedio_compra'],
      ],
      include: departamento_id
        ? [
            {
              model: Solicitud,
              as: 'solicitud',
              where: { departamento_id: parseInt(departamento_id) },
              attributes: [],
            },
          ]
        : [],
      group: ['periodo'],
      order: [['periodo', 'ASC']],
      raw: true,
    })

    // Resumen general
    const resumen = compras.reduce(
      (acc, compra) => {
        acc.total_compras += compra.monto_total
        acc.cantidad_compras += 1
        return acc
      },
      { total_compras: 0, cantidad_compras: 0 }
    )

    resumen.promedio_compra =
      resumen.cantidad_compras > 0
        ? resumen.total_compras / resumen.cantidad_compras
        : 0

    res.json({
      success: true,
      data: {
        compras,
        tendencia_periodo: tendenciaPeriodo.map((t) => ({
          periodo: t.periodo,
          cantidad_compras: parseInt(t.cantidad_compras),
          monto_total: parseFloat(t.monto_total),
          promedio_compra: parseFloat(t.promedio_compra),
        })),
        resumen,
      },
    })
  } catch (error) {
    console.error('Error en getReporteComprasPeriodo:', error)
    res.status(500).json({
      success: false,
      error: 'Error al generar reporte de compras por período',
      details: error.message,
    })
  }
}

// 2. Análisis por departamento
const getReporteComprasDepartamentos = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, departamento_ids } = req.query

    const whereConditions = {
      fecha_compra: {
        [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)],
      },
    }

    let departamentoFilter = {}
    if (departamento_ids) {
      // ✅ CORRECCIÓN: Convertir array de strings a integers
      const ids = Array.isArray(departamento_ids)
        ? departamento_ids.map((id) => parseInt(id))
        : [parseInt(departamento_ids)]
      departamentoFilter = { id_departamento: { [Op.in]: ids } }
    }

    // Análisis por departamento
    const comprasPorDepartamento = await Compra.findAll({
      where: whereConditions,
      attributes: [
        [fn('COUNT', col('Compra.id_compra')), 'cantidad_compras'],
        [fn('SUM', col('Compra.monto_total')), 'monto_total'],
        [fn('AVG', col('Compra.monto_total')), 'promedio_compra'],
      ],
      include: [
        {
          model: Solicitud,
          as: 'solicitud',
          include: [
            {
              model: Departamento,
              as: 'departamento',
              where: departamentoFilter,
              attributes: [
                'id_departamento',
                'nombre_departamento',
                'codigo_departamento',
              ],
            },
          ],
          attributes: [],
        },
      ],
      group: [
        'solicitud.departamento.id_departamento',
        'solicitud.departamento.nombre_departamento',
        'solicitud.departamento.codigo_departamento',
      ],
      raw: true,
      nest: true,
    })

    // Ranking de departamentos
    const ranking = comprasPorDepartamento
      .map((d) => ({
        departamento: d.solicitud.departamento.nombre_departamento,
        codigo: d.solicitud.departamento.codigo_departamento,
        cantidad_compras: parseInt(d.cantidad_compras),
        monto_total: parseFloat(d.monto_total),
        promedio_compra: parseFloat(d.promedio_compra),
      }))
      .sort((a, b) => b.monto_total - a.monto_total)

    res.json({
      success: true,
      data: {
        compras_por_departamento: ranking,
        total_departamentos: ranking.length,
        resumen_general: {
          monto_total_global: ranking.reduce(
            (sum, d) => sum + d.monto_total,
            0
          ),
          cantidad_total_compras: ranking.reduce(
            (sum, d) => sum + d.cantidad_compras,
            0
          ),
        },
      },
    })
  } catch (error) {
    console.error('Error en getReporteComprasDepartamentos:', error)
    res.status(500).json({
      success: false,
      error: 'Error al generar reporte por departamentos',
      details: error.message,
    })
  }
}

// 3. Ranking de proveedores
const getRankingProveedores = async (req, res) => {
  try {
    const {
      fecha_inicio,
      fecha_fin,
      criterio = 'volumen',
      limite = 10,
    } = req.query

    const whereConditions = {
      fecha_compra: {
        [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)],
      },
    }

    // Estadísticas por proveedor
    const proveedorStats = await Compra.findAll({
      where: whereConditions,
      attributes: [
        [fn('COUNT', col('Compra.id_compra')), 'frecuencia_uso'],
        [fn('SUM', col('Compra.monto_total')), 'volumen_compras'],
        [fn('AVG', col('Compra.monto_total')), 'promedio_orden'],
        [
          fn('AVG', col('proveedor.calificacion_promedio')),
          'calificacion_promedio',
        ],
      ],
      include: [
        {
          model: Proveedor,
          as: 'proveedor',
          attributes: ['id_proveedor', 'nombre_proveedor', 'rfc'],
        },
      ],
      group: [
        'proveedor.id_proveedor',
        'proveedor.nombre_proveedor',
        'proveedor.rfc',
        'proveedor.calificacion_promedio',
      ],
      raw: true,
      nest: true,
    })

    // Ordenar según criterio
    let ranking = proveedorStats.map((p) => ({
      proveedor: p.proveedor.nombre_proveedor,
      rfc: p.proveedor.rfc,
      frecuencia_uso: parseInt(p.frecuencia_uso),
      volumen_compras: parseFloat(p.volumen_compras),
      promedio_orden: parseFloat(p.promedio_orden),
      calificacion_promedio: parseFloat(p.calificacion_promedio) || 0,
    }))

    switch (criterio) {
      case 'volumen':
        ranking.sort((a, b) => b.volumen_compras - a.volumen_compras)
        break
      case 'frecuencia':
        ranking.sort((a, b) => b.frecuencia_uso - a.frecuencia_uso)
        break
      case 'calificacion':
        ranking.sort(
          (a, b) => b.calificacion_promedio - a.calificacion_promedio
        )
        break
      default:
        ranking.sort((a, b) => b.volumen_compras - a.volumen_compras)
    }

    const topProveedores = ranking.slice(0, parseInt(limite))

    res.json({
      success: true,
      data: {
        ranking: topProveedores,
        criterio_ordenamiento: criterio,
        total_proveedores: ranking.length,
        resumen: {
          volumen_total: ranking.reduce((sum, p) => sum + p.volumen_compras, 0),
          ordenes_totales: ranking.reduce(
            (sum, p) => sum + p.frecuencia_uso,
            0
          ),
        },
      },
    })
  } catch (error) {
    console.error('Error en getRankingProveedores:', error)
    res.status(500).json({
      success: false,
      error: 'Error al generar ranking de proveedores',
      details: error.message,
    })
  }
}

// 4. Cumplimiento de entregas
const getCumplimientoEntregas = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, proveedor_id } = req.query

    const whereConditions = {
      fecha_compra: {
        [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)],
      },
      fecha_entrega_estimada: { [Op.not]: null },
    }

    // ✅ CORRECCIÓN: proveedor_seleccionado es STRING, mantener como string
    if (proveedor_id) {
      whereConditions.proveedor_seleccionado = proveedor_id
    }

    const comprasConEntrega = await Compra.findAll({
      where: whereConditions,
      include: [
        { model: Proveedor, as: 'proveedor', attributes: ['nombre_proveedor'] },
      ],
    })

    // Análisis de cumplimiento
    const analisis = comprasConEntrega.map((compra) => {
      const fechaEstimada = new Date(compra.fecha_entrega_estimada)
      const fechaReal = compra.fecha_entrega_real
        ? new Date(compra.fecha_entrega_real)
        : new Date()
      const diasDiferencia = Math.ceil(
        (fechaReal - fechaEstimada) / (1000 * 60 * 60 * 24)
      )

      return {
        numero_orden: compra.numero_orden,
        proveedor: compra.proveedor?.nombre_proveedor,
        fecha_estimada: compra.fecha_entrega_estimada,
        fecha_real: compra.fecha_entrega_real,
        dias_diferencia: diasDiferencia,
        entrega_a_tiempo: diasDiferencia <= 0,
        estatus: compra.estatus,
      }
    })

    // Estadísticas por proveedor
    const statsPorProveedor = {}
    analisis.forEach((item) => {
      if (!statsPorProveedor[item.proveedor]) {
        statsPorProveedor[item.proveedor] = {
          total_entregas: 0,
          entregas_a_tiempo: 0,
          total_dias_retraso: 0,
          entregas_completadas: 0,
        }
      }

      const stats = statsPorProveedor[item.proveedor]
      stats.total_entregas++

      if (item.entrega_a_tiempo) stats.entregas_a_tiempo++
      if (item.dias_diferencia > 0)
        stats.total_dias_retraso += item.dias_diferencia
      if (item.estatus === 'entregada') stats.entregas_completadas++
    })

    // Calcular porcentajes
    const rankingCumplimiento = Object.entries(statsPorProveedor)
      .map(([proveedor, stats]) => ({
        proveedor,
        porcentaje_cumplimiento: (
          (stats.entregas_a_tiempo / stats.total_entregas) *
          100
        ).toFixed(2),
        promedio_dias_retraso:
          stats.total_dias_retraso > 0
            ? (
                stats.total_dias_retraso /
                (stats.total_entregas - stats.entregas_a_tiempo)
              ).toFixed(1)
            : 0,
        total_entregas: stats.total_entregas,
        entregas_completadas: stats.entregas_completadas,
      }))
      .sort((a, b) => b.porcentaje_cumplimiento - a.porcentaje_cumplimiento)

    res.json({
      success: true,
      data: {
        analisis_detallado: analisis,
        ranking_cumplimiento: rankingCumplimiento,
        resumen_general: {
          total_ordenes: analisis.length,
          entregas_a_tiempo: analisis.filter((a) => a.entrega_a_tiempo).length,
          porcentaje_cumplimiento_global: (
            (analisis.filter((a) => a.entrega_a_tiempo).length /
              analisis.length) *
            100
          ).toFixed(2),
        },
      },
    })
  } catch (error) {
    console.error('Error en getCumplimientoEntregas:', error)
    res.status(500).json({
      success: false,
      error: 'Error al generar reporte de cumplimiento',
      details: error.message,
    })
  }
}

// ===== REPORTES DE SOLICITUDES =====

// 5. Solicitudes por estatus y tiempo de aprobación
const getReporteSolicitudesEstatus = async (req, res) => {
  try {
    const {
      fecha_inicio,
      fecha_fin,
      estatus,
      incluir_tiempos = 'true',
    } = req.query

    console.log('🔍 Parámetros recibidos:', {
      fecha_inicio,
      fecha_fin,
      estatus,
    })

    // 🔧 CORREGIR MANEJO DE FECHAS CON ZONA HORARIA LOCAL
    // Crear fechas en zona horaria local (México)
    const fechaInicioStr = `${fecha_inicio}T00:00:00.000`
    const fechaFinStr = `${fecha_fin}T23:59:59.999`

    const fechaInicioObj = new Date(fechaInicioStr)
    const fechaFinObj = new Date(fechaFinStr)

    console.log('📅 Fechas procesadas:', {
      fechaInicio: fechaInicioObj.toISOString(),
      fechaFin: fechaFinObj.toISOString(),
      fechaInicioLocal: fechaInicioObj.toLocaleString(),
      fechaFinLocal: fechaFinObj.toLocaleString(),
    })

    const whereConditions = {
      fecha_creacion: {
        [Op.between]: [fechaInicioObj, fechaFinObj],
      },
    }

    if (estatus) whereConditions.estatus = estatus

    console.log('🔍 Condiciones WHERE:', {
      ...whereConditions,
      fecha_creacion: {
        between: [fechaInicioObj.toISOString(), fechaFinObj.toISOString()],
      },
    })

    // 🧪 CONSULTA DE DEBUGGING - Ver todas las solicitudes del día sin filtros de hora
    const debugQuery = await Solicitud.findAll({
      attributes: ['folio_solicitud', 'fecha_creacion', 'estatus'],
      where: {
        fecha_creacion: {
          [Op.gte]: new Date(`${fecha_inicio}T00:00:00.000`),
          [Op.lte]: new Date(`${fecha_fin}T23:59:59.999`),
        },
      },
      raw: true,
      limit: 10,
    })

    console.log(
      '🧪 DEBUG - Solicitudes encontradas:',
      debugQuery.map((s) => ({
        folio: s.folio_solicitud,
        fecha: s.fecha_creacion,
        estatus: s.estatus,
      }))
    )

    // 🧪 VERIFICAR CANTIDAD DE SOLICITUDES EN EL RANGO
    const totalSolicitudesEnRango = await Solicitud.count({
      where: whereConditions,
    })

    console.log(`📊 Total solicitudes encontradas: ${totalSolicitudesEnRango}`)

    // Solicitudes con información de aprobaciones
    const solicitudes = await Solicitud.findAll({
      where: whereConditions,
      include: [
        { model: Usuario, as: 'solicitante', attributes: ['nombre_completo'] },
        {
          model: Departamento,
          as: 'departamento',
          attributes: ['nombre_departamento'],
        },
        {
          model: Aprobacion,
          as: 'aprobaciones',
          include: [
            {
              model: Usuario,
              as: 'aprobador',
              attributes: ['nombre_completo'],
            },
          ],
        },
      ],
      order: [['fecha_creacion', 'DESC']],
    })

    console.log(`✅ Solicitudes obtenidas con includes: ${solicitudes.length}`)

    // Análisis de tiempos de aprobación
    const analisisTiempos = solicitudes.map((solicitud) => {
      const aprobaciones = solicitud.aprobaciones || []
      const fechaCreacion = new Date(solicitud.fecha_creacion)

      let tiempoAprobacion = null
      if (aprobaciones.length > 0) {
        const ultimaAprobacion = aprobaciones[aprobaciones.length - 1]
        const fechaAprobacion = new Date(ultimaAprobacion.fecha_accion)
        tiempoAprobacion = Math.ceil(
          (fechaAprobacion - fechaCreacion) / (1000 * 60 * 60 * 24)
        )
      }

      return {
        folio_solicitud: solicitud.folio_solicitud,
        solicitante: solicitud.solicitante?.nombre_completo,
        departamento: solicitud.departamento?.nombre_departamento,
        fecha_creacion: solicitud.fecha_creacion,
        estatus: solicitud.estatus,
        tipo_requisicion: solicitud.tipo_requisicion,
        urgencia: solicitud.urgencia,
        tiempo_aprobacion_dias: tiempoAprobacion,
        numero_aprobaciones: aprobaciones.length,
      }
    })

    // Distribución por estatus
    const distribucionEstatus = await Solicitud.findAll({
      where: whereConditions,
      attributes: ['estatus', [fn('COUNT', col('id_solicitud')), 'cantidad']],
      group: ['estatus'],
      raw: true,
    })

    console.log('📈 Distribución por estatus:', distribucionEstatus)

    // Estadísticas de tiempo
    const tiemposValidos = analisisTiempos.filter(
      (s) => s.tiempo_aprobacion_dias !== null
    )
    const promedioTiempo =
      tiemposValidos.length > 0
        ? tiemposValidos.reduce((sum, s) => sum + s.tiempo_aprobacion_dias, 0) /
          tiemposValidos.length
        : 0

    const responseData = {
      success: true,
      data: {
        solicitudes: analisisTiempos,
        distribucion_estatus: distribucionEstatus.map((d) => ({
          estatus: d.estatus,
          cantidad: parseInt(d.cantidad),
        })),
        estadisticas_tiempo:
          incluir_tiempos === 'true'
            ? {
                promedio_dias_aprobacion:
                  Math.round(promedioTiempo * 100) / 100,
                solicitudes_con_aprobacion: tiemposValidos.length,
                tiempo_minimo:
                  tiemposValidos.length > 0
                    ? Math.min(
                        ...tiemposValidos.map((t) => t.tiempo_aprobacion_dias)
                      )
                    : 0,
                tiempo_maximo:
                  tiemposValidos.length > 0
                    ? Math.max(
                        ...tiemposValidos.map((t) => t.tiempo_aprobacion_dias)
                      )
                    : 0,
              }
            : null,
        // 🧪 AGREGAR INFO DE DEBUG
        debug_info:
          process.env.NODE_ENV === 'development'
            ? {
                fecha_inicio_procesada: fechaInicioObj.toISOString(),
                fecha_fin_procesada: fechaFinObj.toISOString(),
                total_solicitudes_en_rango: totalSolicitudesEnRango,
                where_conditions: whereConditions,
                debug_solicitudes: debugQuery,
                timezone_info: {
                  server_timezone:
                    Intl.DateTimeFormat().resolvedOptions().timeZone,
                  fecha_inicio_local: fechaInicioObj.toLocaleString(),
                  fecha_fin_local: fechaFinObj.toLocaleString(),
                },
              }
            : undefined,
      },
    }

    console.log('✅ Respuesta generada exitosamente')
    res.json(responseData)
  } catch (error) {
    console.error('❌ Error en getReporteSolicitudesEstatus:', error)
    console.error('📍 Stack:', error.stack)

    res.status(500).json({
      success: false,
      error: 'Error al generar reporte de solicitudes por estatus',
      details: error.message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
      }),
    })
  }
}

// 6. Identificación de cuellos de botella
const getCuellosBottella = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, nivel_detalle = 'resumen' } = req.query

    const whereConditions = {
      fecha_creacion: {
        [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)],
      },
    }

    // Análisis de aprobaciones por usuario
    const aprobacionesPorUsuario = await Aprobacion.findAll({
      attributes: [
        [fn('COUNT', col('Aprobacion.id_aprobacion')), 'total_aprobaciones'],
        [
          fn(
            'AVG',
            literal(
              `EXTRACT(EPOCH FROM (fecha_accion - solicitud.fecha_creacion)) / 86400`
            )
          ),
          'promedio_dias_respuesta',
        ],
      ],
      include: [
        {
          model: Usuario,
          as: 'aprobador',
          attributes: ['nombre_completo', 'departamento_id'],
          include: [
            {
              model: Departamento,
              as: 'departamento',
              attributes: ['nombre_departamento'],
            },
          ],
        },
        {
          model: Solicitud,
          as: 'solicitud',
          where: whereConditions,
          attributes: [],
        },
      ],
      group: [
        'aprobador.id_usuario',
        'aprobador.nombre_completo',
        'aprobador.departamento_id',
        'aprobador.departamento.id_departamento',
        'aprobador.departamento.nombre_departamento',
      ],
      raw: true,
      nest: true,
    })

    // Solicitudes estancadas (más de 7 días sin movimiento)
    const solicitudesEstancadas = await Solicitud.findAll({
      where: {
        ...whereConditions,
        estatus: ['pendiente', 'en_revision'],
        fecha_creacion: {
          [Op.lt]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 días atrás
        },
      },
      include: [
        { model: Usuario, as: 'solicitante', attributes: ['nombre_completo'] },
        {
          model: Departamento,
          as: 'departamento',
          attributes: ['nombre_departamento'],
        },
      ],
    })

    // Análisis por etapas del proceso
    const analisisEtapas = await Solicitud.findAll({
      where: whereConditions,
      attributes: [
        'estatus',
        [fn('COUNT', col('id_solicitud')), 'cantidad'],
        [
          fn(
            'AVG',
            literal(`EXTRACT(EPOCH FROM (updated_at - fecha_creacion)) / 86400`)
          ),
          'promedio_dias_etapa',
        ],
      ],
      group: ['estatus'],
      raw: true,
    })

    const cuellosBottella = aprobacionesPorUsuario
      .map((a) => ({
        aprobador: a.aprobador.nombre_completo,
        departamento: a.aprobador.departamento?.nombre_departamento,
        total_aprobaciones: parseInt(a.total_aprobaciones),
        promedio_dias_respuesta: parseFloat(a.promedio_dias_respuesta) || 0,
      }))
      .sort((a, b) => b.promedio_dias_respuesta - a.promedio_dias_respuesta)

    res.json({
      success: true,
      data: {
        cuellos_botella: cuellosBottella,
        solicitudes_estancadas: solicitudesEstancadas.map((s) => ({
          folio_solicitud: s.folio_solicitud,
          solicitante: s.solicitante?.nombre_completo,
          departamento: s.departamento?.nombre_departamento,
          fecha_creacion: s.fecha_creacion,
          dias_estancada: Math.ceil(
            (new Date() - new Date(s.fecha_creacion)) / (1000 * 60 * 60 * 24)
          ),
          estatus: s.estatus,
        })),
        analisis_etapas: analisisEtapas.map((e) => ({
          etapa: e.estatus,
          cantidad_solicitudes: parseInt(e.cantidad),
          promedio_dias_etapa: parseFloat(e.promedio_dias_etapa) || 0,
        })),
        recomendaciones: [
          cuellosBottella.length > 0 &&
          cuellosBottella[0].promedio_dias_respuesta > 5
            ? `Revisar carga de trabajo de ${cuellosBottella[0].aprobador}`
            : null,
          solicitudesEstancadas.length > 0
            ? `${solicitudesEstancadas.length} solicitudes requieren atención inmediata`
            : null,
        ].filter(Boolean),
      },
    })
  } catch (error) {
    console.error('Error en getCuellosBottella:', error)
    res.status(500).json({
      success: false,
      error: 'Error al identificar cuellos de botella',
      details: error.message,
    })
  }
}

// 7. Dashboard ejecutivo
const getDashboardEjecutivo = async (req, res) => {
  try {
    const { periodo = 'mes' } = req.query

    console.log('🎯 Dashboard ejecutivo - Iniciando...')
    console.log('📝 Query params:', req.query)
    console.log('👤 Usuario:', req.user?.nombre_completo, 'Rol:', req.user?.rol)

    // Calcular fechas según período
    const ahora = new Date()
    let fechaInicio

    switch (periodo) {
      case 'hoy':
        fechaInicio = new Date(
          ahora.getFullYear(),
          ahora.getMonth(),
          ahora.getDate()
        )
        break
      case 'semana':
        fechaInicio = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'mes':
        fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
        break
      case 'trimestre':
        const mesActual = ahora.getMonth()
        const inicioTrimestre = Math.floor(mesActual / 3) * 3
        fechaInicio = new Date(ahora.getFullYear(), inicioTrimestre, 1)
        break
      case 'año':
      case 'anio':
        fechaInicio = new Date(ahora.getFullYear(), 0, 1) // 1 de enero del año actual
        break
      default:
        fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
    }

    console.log('📅 Fechas calculadas:', { fechaInicio, fechaFin: ahora })

    // ... resto del código permanece igual
    const [
      totalSolicitudes,
      solicitudesPendientes,
      totalCompras,
      montoTotalCompras,
    ] = await Promise.all([
      Solicitud.count({ where: { fecha_creacion: { [Op.gte]: fechaInicio } } }),
      Solicitud.count({ where: { estatus: 'pendiente' } }),
      Compra.count({ where: { fecha_compra: { [Op.gte]: fechaInicio } } }),
      Compra.sum('monto_total', {
        where: { fecha_compra: { [Op.gte]: fechaInicio } },
      }),
    ])

    console.log('📊 KPIs calculados:', {
      totalSolicitudes,
      solicitudesPendientes,
      totalCompras,
      montoTotalCompras,
    })

    // Tendencias (comparación con período anterior)
    const duracionPeriodo = ahora.getTime() - fechaInicio.getTime()
    const fechaInicioAnterior = new Date(
      fechaInicio.getTime() - duracionPeriodo
    )

    const [solicitudesAnterior, comprasAnterior, montoAnterior] =
      await Promise.all([
        Solicitud.count({
          where: {
            fecha_creacion: {
              [Op.between]: [fechaInicioAnterior, fechaInicio],
            },
          },
        }),
        Compra.count({
          where: {
            fecha_compra: {
              [Op.between]: [fechaInicioAnterior, fechaInicio],
            },
          },
        }),
        Compra.sum('monto_total', {
          where: {
            fecha_compra: {
              [Op.between]: [fechaInicioAnterior, fechaInicio],
            },
          },
        }),
      ])

    // Calcular porcentajes de cambio
    const calcularCambio = (actual, anterior) => {
      if (anterior === 0) return actual > 0 ? 100 : 0
      return (((actual - anterior) / anterior) * 100).toFixed(1)
    }

    // TOP DEPARTAMENTOS - CONSULTA CORREGIDA
    console.log('🏢 Consultando top departamentos...')

    const topDepartamentos = await Compra.findAll({
      where: { fecha_compra: { [Op.gte]: fechaInicio } },
      attributes: [
        [fn('SUM', col('monto_total')), 'total_gasto'],
        [fn('COUNT', col('Compra.id_compra')), 'cantidad_compras'],
      ],
      include: [
        {
          model: Solicitud,
          as: 'solicitud',
          include: [
            {
              model: Departamento,
              as: 'departamento',
              attributes: ['id_departamento', 'nombre_departamento'],
            },
          ],
          attributes: [],
        },
      ],
      group: [
        'solicitud.departamento.id_departamento',
        'solicitud.departamento.nombre_departamento',
      ],
      order: [[fn('SUM', col('monto_total')), 'DESC']],
      limit: 5,
      raw: true,
      nest: true,
    })

    console.log('🏢 Top departamentos encontrados:', topDepartamentos.length)

    // Alertas
    const alertas = []
    if (solicitudesPendientes > 10) {
      alertas.push({
        tipo: 'warning',
        mensaje: `${solicitudesPendientes} solicitudes pendientes requieren atención`,
      })
    }

    const solicitudesUrgentes = await Solicitud.count({
      where: { urgencia: 'critica', estatus: 'pendiente' },
    })

    if (solicitudesUrgentes > 0) {
      alertas.push({
        tipo: 'critical',
        mensaje: `${solicitudesUrgentes} solicitudes críticas sin atender`,
      })
    }

    console.log('🚨 Alertas generadas:', alertas.length)

    const responseData = {
      success: true,
      data: {
        kpis: {
          total_solicitudes: {
            valor: totalSolicitudes,
            cambio_porcentual: calcularCambio(
              totalSolicitudes,
              solicitudesAnterior
            ),
          },
          solicitudes_pendientes: {
            valor: solicitudesPendientes,
            porcentaje_del_total:
              totalSolicitudes > 0
                ? ((solicitudesPendientes / totalSolicitudes) * 100).toFixed(1)
                : 0,
          },
          total_compras: {
            valor: totalCompras,
            cambio_porcentual: calcularCambio(totalCompras, comprasAnterior),
          },
          monto_total_compras: {
            valor: parseFloat(montoTotalCompras) || 0,
            cambio_porcentual: calcularCambio(
              montoTotalCompras || 0,
              montoAnterior || 0
            ),
          },
        },
        top_departamentos: topDepartamentos.map((d) => ({
          departamento: d.solicitud.departamento.nombre_departamento,
          total_gasto: parseFloat(d.total_gasto),
          cantidad_compras: parseInt(d.cantidad_compras),
        })),
        alertas,
        periodo_analizado: periodo,
        fecha_inicio: fechaInicio,
        fecha_fin: ahora,
      },
    }

    console.log('✅ Dashboard ejecutivo completado exitosamente')
    res.json(responseData)
  } catch (error) {
    console.error('❌ Error en getDashboardEjecutivo:', error)
    console.error('📍 Stack trace:', error.stack)

    res.status(500).json({
      success: false,
      error: 'Error al generar dashboard ejecutivo',
      details: error.message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        sql_error: error.sql || null,
      }),
    })
  }
}

// 8. Exportación avanzada de reportes
const exportarReporteAvanzado = async (req, res) => {
  try {
    const {
      tipo_reporte,
      formato,
      parametros,
      incluir_graficos = true,
    } = req.body

    let data
    let titulo

    // Obtener datos según el tipo de reporte
    switch (tipo_reporte) {
      case 'compras_periodo':
        data = await obtenerDatosComprasPeriodo(parametros)
        titulo = 'Reporte de Compras por Período'
        break
      case 'solicitudes_estatus':
        data = await obtenerDatosSolicitudesEstatus(parametros)
        titulo = 'Reporte de Solicitudes por Estatus'
        break
      case 'ranking_proveedores':
        data = await obtenerDatosRankingProveedores(parametros)
        titulo = 'Ranking de Proveedores'
        break
      case 'dashboard_ejecutivo':
        data = await obtenerDatosDashboard(parametros)
        titulo = 'Dashboard Ejecutivo'
        break
      default:
        return res.status(400).json({
          success: false,
          error: 'Tipo de reporte no válido',
        })
    }

    if (formato === 'pdf') {
      await generarPDFAvanzado(res, data, titulo, parametros, tipo_reporte)
    } else if (formato === 'xlsx') {
      await generarExcelAvanzado(res, data, titulo, parametros, tipo_reporte)
    } else if (formato === 'csv') {
      await generarCSVAvanzado(res, data, titulo, parametros, tipo_reporte)
    } else {
      res.status(400).json({
        success: false,
        error: 'Formato no soportado',
      })
    }
  } catch (error) {
    console.error('Error en exportarReporteAvanzado:', error)
    res.status(500).json({
      success: false,
      error: 'Error al exportar reporte',
      details: error.message,
    })
  }
}

// ===== FUNCIONES AUXILIARES PARA OBTENER DATOS =====

const obtenerDatosComprasPeriodo = async (parametros) => {
  const { fecha_inicio, fecha_fin, departamento_id, proveedor_nombre } =
    parametros

  const whereConditions = {
    fecha_compra: {
      [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)],
    },
  }

  // ✅ CORRECCIÓN: Sin tabla Proveedor
  if (departamento_id) {
    whereConditions['$solicitud.departamento_id$'] = parseInt(departamento_id)
  }
  if (proveedor_nombre) {
    // Buscar por nombre del proveedor en el campo de texto
    whereConditions.proveedor_seleccionado = {
      [Op.iLike]: `%${proveedor_nombre}%`, // Búsqueda parcial insensible a mayúsculas
    }
  }

  const compras = await Compra.findAll({
    where: whereConditions,
    include: [
      {
        model: Solicitud,
        as: 'solicitud',
        include: [
          {
            model: Departamento,
            as: 'departamento',
            attributes: ['nombre_departamento'],
          },
          {
            model: Usuario,
            as: 'solicitante',
            attributes: ['nombre_completo'],
          },
        ],
      },
      // ❌ ELIMINADO: include de Proveedor que no existe
    ],
    order: [['fecha_compra', 'DESC']],
  })

  return {
    compras: compras.map((c) => ({
      numero_orden: c.numero_orden,
      proveedor: c.proveedor_seleccionado || 'Sin asignar', // ✅ Campo directo
      departamento: c.solicitud?.departamento?.nombre_departamento || 'N/A',
      solicitante: c.solicitud?.solicitante?.nombre_completo || 'N/A',
      fecha_compra: c.fecha_compra,
      monto_total: parseFloat(c.monto_total),
      estatus: c.estatus,
    })),
    resumen: {
      total_compras: compras.reduce(
        (sum, c) => sum + parseFloat(c.monto_total),
        0
      ),
      cantidad_compras: compras.length,
      promedio_compra:
        compras.length > 0
          ? compras.reduce((sum, c) => sum + parseFloat(c.monto_total), 0) /
            compras.length
          : 0,
    },
  }
}

const obtenerDatosSolicitudesEstatus = async (parametros) => {
  const { fecha_inicio, fecha_fin, estatus } = parametros

  // 🔧 APLICAR LA MISMA CORRECCIÓN DE FECHAS CON ZONA HORARIA LOCAL
  const fechaInicioStr = `${fecha_inicio}T00:00:00.000`
  const fechaFinStr = `${fecha_fin}T23:59:59.999`

  const fechaInicioObj = new Date(fechaInicioStr)
  const fechaFinObj = new Date(fechaFinStr)

  const whereConditions = {
    fecha_creacion: {
      [Op.between]: [fechaInicioObj, fechaFinObj],
    },
  }

  if (estatus) whereConditions.estatus = estatus

  const solicitudes = await Solicitud.findAll({
    where: whereConditions,
    include: [
      {
        model: Usuario,
        as: 'solicitante',
        attributes: ['nombre_completo'],
      },
      {
        model: Departamento,
        as: 'departamento',
        attributes: ['nombre_departamento'],
      },
    ],
    order: [['fecha_creacion', 'DESC']],
  })

  return {
    solicitudes: solicitudes.map((s) => ({
      folio_solicitud: s.folio_solicitud,
      solicitante: s.solicitante?.nombre_completo || 'N/A',
      departamento: s.departamento?.nombre_departamento || 'N/A',
      fecha_creacion: s.fecha_creacion,
      tipo_requisicion: s.tipo_requisicion,
      urgencia: s.urgencia,
      estatus: s.estatus,
      presupuesto_estimado: parseFloat(s.presupuesto_estimado) || 0,
    })),
    resumen: {
      total_solicitudes: solicitudes.length,
      por_estatus: solicitudes.reduce((acc, s) => {
        acc[s.estatus] = (acc[s.estatus] || 0) + 1
        return acc
      }, {}),
    },
  }
}

const obtenerDatosRankingProveedores = async (parametros) => {
  const {
    fecha_inicio,
    fecha_fin,
    criterio = 'volumen',
    limite = 10,
  } = parametros

  const whereConditions = {
    fecha_compra: {
      [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)],
    },
    proveedor_seleccionado: {
      [Op.ne]: null, // Excluir compras sin proveedor
      [Op.ne]: '', // Excluir strings vacíos
    },
  }

  // ✅ CONSULTA SIN TABLA PROVEEDOR - Agrupando por nombre directo
  const proveedorStats = await Compra.findAll({
    where: whereConditions,
    attributes: [
      'proveedor_seleccionado',
      [fn('COUNT', col('Compra.id_compra')), 'frecuencia_uso'],
      [fn('SUM', col('Compra.monto_total')), 'volumen_compras'],
      [fn('AVG', col('Compra.monto_total')), 'promedio_orden'],
      // ✅ Calificación simulada (puedes ajustar esta lógica)
      [literal('4.0'), 'calificacion_promedio'], // Valor fijo o calcular basado en otros criterios
    ],
    group: ['proveedor_seleccionado'],
    raw: true,
  })

  // Procesar y ordenar datos
  let ranking = proveedorStats.map((p) => ({
    proveedor: p.proveedor_seleccionado,
    rfc: 'N/A', // No hay RFC disponible sin tabla proveedores
    frecuencia_uso: parseInt(p.frecuencia_uso),
    volumen_compras: parseFloat(p.volumen_compras),
    promedio_orden: parseFloat(p.promedio_orden),
    calificacion_promedio: parseFloat(p.calificacion_promedio) || 4.0,
  }))

  // Ordenar según criterio
  switch (criterio) {
    case 'volumen':
      ranking.sort((a, b) => b.volumen_compras - a.volumen_compras)
      break
    case 'frecuencia':
      ranking.sort((a, b) => b.frecuencia_uso - a.frecuencia_uso)
      break
    case 'calificacion':
      ranking.sort((a, b) => b.calificacion_promedio - a.calificacion_promedio)
      break
    default:
      ranking.sort((a, b) => b.volumen_compras - a.volumen_compras)
  }

  return {
    ranking: ranking.slice(0, parseInt(limite)),
    criterio,
    total_proveedores: ranking.length,
    resumen: {
      volumen_total: ranking.reduce((sum, p) => sum + p.volumen_compras, 0),
      ordenes_totales: ranking.reduce((sum, p) => sum + p.frecuencia_uso, 0),
    },
  }
}

const obtenerDatosDashboard = async (parametros) => {
  const { periodo = 'mes' } = parametros

  // Calcular fechas según período
  const ahora = new Date()
  let fechaInicio

  switch (periodo) {
    case 'hoy':
      fechaInicio = new Date(
        ahora.getFullYear(),
        ahora.getMonth(),
        ahora.getDate()
      )
      break
    case 'semana':
      fechaInicio = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'mes':
      fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
      break
    case 'trimestre':
      const mesActual = ahora.getMonth()
      const inicioTrimestre = Math.floor(mesActual / 3) * 3
      fechaInicio = new Date(ahora.getFullYear(), inicioTrimestre, 1)
      break
    case 'año':
    case 'anio':
      fechaInicio = new Date(ahora.getFullYear(), 0, 1)
      break
    default:
      fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
  }

  // KPIs básicos para el dashboard
  const [
    totalSolicitudes,
    solicitudesPendientes,
    totalCompras,
    montoTotalCompras,
  ] = await Promise.all([
    Solicitud.count({ where: { fecha_creacion: { [Op.gte]: fechaInicio } } }),
    Solicitud.count({ where: { estatus: 'pendiente' } }),
    Compra.count({ where: { fecha_compra: { [Op.gte]: fechaInicio } } }),
    Compra.sum('monto_total', {
      where: { fecha_compra: { [Op.gte]: fechaInicio } },
    }),
  ])

  // ✅ Top proveedores sin tabla Proveedor
  const topProveedores = await Compra.findAll({
    where: {
      fecha_compra: { [Op.gte]: fechaInicio },
      proveedor_seleccionado: { [Op.ne]: null, [Op.ne]: '' },
    },
    attributes: [
      'proveedor_seleccionado',
      [fn('SUM', col('monto_total')), 'total_gasto'],
      [fn('COUNT', col('Compra.id_compra')), 'cantidad_compras'],
    ],
    group: ['proveedor_seleccionado'],
    order: [[fn('SUM', col('monto_total')), 'DESC']],
    limit: 5,
    raw: true,
  })

  return {
    kpis: {
      total_solicitudes: totalSolicitudes,
      solicitudes_pendientes: solicitudesPendientes,
      total_compras: totalCompras,
      monto_total_compras: parseFloat(montoTotalCompras) || 0,
    },
    top_proveedores: topProveedores.map((p) => ({
      proveedor: p.proveedor_seleccionado,
      total_gasto: parseFloat(p.total_gasto),
      cantidad_compras: parseInt(p.cantidad_compras),
    })),
    periodo_analizado: periodo,
    fecha_inicio: fechaInicio,
    fecha_fin: ahora,
  }
}

// ===== FUNCIONES DE GENERACIÓN DE ARCHIVOS =====

const generarPDFAvanzado = async (
  res,
  data,
  titulo,
  parametros,
  tipoReporte
) => {
  const doc = new PDFDocument({ margin: 50 })

  const fecha = new Date().toISOString().split('T')[0]
  const nombreArchivo = `${titulo.replace(/\s+/g, '_')}_${fecha}.pdf`

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${nombreArchivo}"`
  )
  doc.pipe(res)

  // Encabezado
  doc.fontSize(20).font('Helvetica-Bold').text(titulo, { align: 'center' })
  doc.moveDown(0.5)
  doc
    .fontSize(12)
    .font('Helvetica')
    .text(`Generado el: ${new Date().toLocaleString('es-MX')}`, {
      align: 'center',
    })
  doc.moveDown()

  // Línea separadora
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
  doc.moveDown()

  // Información de filtros
  doc.fontSize(14).font('Helvetica-Bold').text('Parámetros del Reporte:')
  doc.fontSize(10).font('Helvetica')

  if (parametros.fecha_inicio) {
    doc.text(
      `• Fecha inicio: ${new Date(parametros.fecha_inicio).toLocaleDateString('es-MX')}`
    )
  }
  if (parametros.fecha_fin) {
    doc.text(
      `• Fecha fin: ${new Date(parametros.fecha_fin).toLocaleDateString('es-MX')}`
    )
  }
  if (parametros.departamento_id) {
    doc.text(`• Departamento ID: ${parametros.departamento_id}`)
  }
  if (parametros.proveedor_id) {
    doc.text(`• Proveedor ID: ${parametros.proveedor_id}`)
  }

  doc.moveDown()

  // Contenido específico según tipo de reporte
  switch (tipoReporte) {
    case 'compras_periodo':
      await generarContenidoComprasPDF(doc, data)
      break
    case 'solicitudes_estatus':
      await generarContenidoSolicitudesPDF(doc, data)
      break
    case 'ranking_proveedores':
      await generarContenidoRankingPDF(doc, data)
      break
  }

  doc.end()
}

const generarContenidoComprasPDF = async (doc, data) => {
  // Resumen
  doc.fontSize(14).font('Helvetica-Bold').text('Resumen Ejecutivo:')
  doc.fontSize(12).font('Helvetica')
  doc.text(
    `• Total de compras: $${data.resumen.total_compras.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
  )
  doc.text(`• Número de órdenes: ${data.resumen.cantidad_compras}`)
  doc.text(
    `• Promedio por orden: $${data.resumen.promedio_compra.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
  )
  doc.moveDown()

  // Tabla de compras (primeras 25)
  doc.fontSize(14).font('Helvetica-Bold').text('Detalle de Compras:')
  doc.moveDown(0.5)

  // Encabezados de tabla
  const startY = doc.y
  const colWidths = [80, 120, 100, 80, 80, 70]
  const headers = [
    'N° Orden',
    'Proveedor',
    'Departamento',
    'Fecha',
    'Monto',
    'Estatus',
  ]

  let currentX = 50
  doc.fontSize(10).font('Helvetica-Bold')

  headers.forEach((header, i) => {
    doc.text(header, currentX, startY, { width: colWidths[i], align: 'left' })
    currentX += colWidths[i]
  })

  // Línea bajo encabezados
  doc
    .moveTo(50, startY + 15)
    .lineTo(530, startY + 15)
    .stroke()

  // Datos
  let currentY = startY + 20
  doc.font('Helvetica').fontSize(9)

  data.compras.slice(0, 25).forEach((compra) => {
    currentX = 50

    doc.text(compra.numero_orden, currentX, currentY, { width: colWidths[0] })
    currentX += colWidths[0]

    doc.text(compra.proveedor, currentX, currentY, { width: colWidths[1] })
    currentX += colWidths[1]

    doc.text(compra.departamento, currentX, currentY, { width: colWidths[2] })
    currentX += colWidths[2]

    doc.text(
      new Date(compra.fecha_compra).toLocaleDateString('es-MX'),
      currentX,
      currentY,
      { width: colWidths[3] }
    )
    currentX += colWidths[3]

    doc.text(
      `$${compra.monto_total.toLocaleString('es-MX')}`,
      currentX,
      currentY,
      { width: colWidths[4] }
    )
    currentX += colWidths[4]

    doc.text(compra.estatus, currentX, currentY, { width: colWidths[5] })

    currentY += 15

    if (currentY > 700) {
      doc.addPage()
      currentY = 50
    }
  })

  if (data.compras.length > 25) {
    doc.moveDown()
    doc.fontSize(10).font('Helvetica-Oblique')
    doc.text(`... y ${data.compras.length - 25} compras adicionales`)
  }
}

const generarContenidoSolicitudesPDF = async (doc, data) => {
  doc.fontSize(14).font('Helvetica-Bold').text('Resumen de Solicitudes:')
  doc.fontSize(12).font('Helvetica')
  doc.text(`• Total de solicitudes: ${data.resumen.total_solicitudes}`)

  Object.entries(data.resumen.por_estatus).forEach(([estatus, cantidad]) => {
    doc.text(`• ${estatus}: ${cantidad}`)
  })

  doc.moveDown()
  doc.fontSize(14).font('Helvetica-Bold').text('Detalle de Solicitudes:')
  doc.fontSize(10).font('Helvetica').text('(Primeras 20 solicitudes)')

  data.solicitudes.slice(0, 20).forEach((solicitud, index) => {
    doc.text(
      `${index + 1}. ${solicitud.folio_solicitud} - ${solicitud.solicitante} (${solicitud.estatus})`
    )
  })
}

const generarContenidoRankingPDF = async (doc, data) => {
  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .text(`Ranking de Proveedores (Criterio: ${data.criterio}):`)
  doc.moveDown()

  data.ranking.forEach((proveedor, index) => {
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text(`${index + 1}. ${proveedor.proveedor}`)
    doc.fontSize(10).font('Helvetica')
    // ✅ CORREGIDO: Sin RFC ya que no hay tabla proveedores
    doc.text(`   Identificador: ${proveedor.proveedor}`) // Usar nombre como ID
    doc.text(
      `   Volumen de compras: $${proveedor.volumen_compras.toLocaleString('es-MX')}`
    )
    doc.text(`   Frecuencia de uso: ${proveedor.frecuencia_uso} órdenes`)
    doc.text(
      `   Calificación estimada: ${proveedor.calificacion_promedio}/5.00`
    )
    doc.moveDown(0.5)
  })

  // Agregar resumen
  doc.moveDown()
  doc.fontSize(12).font('Helvetica-Bold').text('Resumen del Ranking:')
  doc.fontSize(10).font('Helvetica')
  doc.text(`• Total de proveedores evaluados: ${data.total_proveedores}`)
  doc.text(`• Criterio de ordenamiento: ${data.criterio}`)
  if (data.resumen) {
    doc.text(
      `• Volumen total: $${data.resumen.volumen_total.toLocaleString('es-MX')}`
    )
    doc.text(`• Órdenes totales: ${data.resumen.ordenes_totales}`)
  }
}

const generarExcelAvanzado = async (
  res,
  data,
  titulo,
  parametros,
  tipoReporte
) => {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Reporte')

  // Configurar encabezados
  worksheet.mergeCells('A1:F1')
  worksheet.getCell('A1').value = titulo
  worksheet.getCell('A1').font = { size: 16, bold: true }
  worksheet.getCell('A1').alignment = { horizontal: 'center' }

  worksheet.mergeCells('A2:F2')
  worksheet.getCell('A2').value =
    `Generado el: ${new Date().toLocaleString('es-MX')}`
  worksheet.getCell('A2').alignment = { horizontal: 'center' }

  let currentRow = 4

  // Agregar parámetros
  worksheet.getCell(`A${currentRow}`).value = 'Parámetros:'
  worksheet.getCell(`A${currentRow}`).font = { bold: true }
  currentRow++

  if (parametros.fecha_inicio) {
    worksheet.getCell(`A${currentRow}`).value = 'Fecha inicio:'
    worksheet.getCell(`B${currentRow}`).value = new Date(
      parametros.fecha_inicio
    )
    worksheet.getCell(`B${currentRow}`).numFmt = 'dd/mm/yyyy'
    currentRow++
  }

  if (parametros.fecha_fin) {
    worksheet.getCell(`A${currentRow}`).value = 'Fecha fin:'
    worksheet.getCell(`B${currentRow}`).value = new Date(parametros.fecha_fin)
    worksheet.getCell(`B${currentRow}`).numFmt = 'dd/mm/yyyy'
    currentRow++
  }

  currentRow += 2

  // Contenido específico
  switch (tipoReporte) {
    case 'compras_periodo':
      await generarContenidoComprasExcel(worksheet, data, currentRow)
      break
    case 'solicitudes_estatus':
      await generarContenidoSolicitudesExcel(worksheet, data, currentRow)
      break
    case 'ranking_proveedores':
      await generarContenidoRankingExcel(worksheet, data, currentRow)
      break
  }

  // Configurar respuesta
  const fecha = new Date().toISOString().split('T')[0]
  const nombreArchivo = `${titulo.replace(/\s+/g, '_')}_${fecha}.xlsx`

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  )
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${nombreArchivo}"`
  )

  await workbook.xlsx.write(res)
  res.end()
}

const generarContenidoComprasExcel = async (worksheet, data, startRow) => {
  // Resumen
  worksheet.getCell(`A${startRow}`).value = 'RESUMEN'
  worksheet.getCell(`A${startRow}`).font = { bold: true, size: 14 }
  startRow += 2

  worksheet.getCell(`A${startRow}`).value = 'Total de compras:'
  worksheet.getCell(`B${startRow}`).value = data.resumen.total_compras
  worksheet.getCell(`B${startRow}`).numFmt = '$#,##0.00'
  startRow++

  worksheet.getCell(`A${startRow}`).value = 'Número de órdenes:'
  worksheet.getCell(`B${startRow}`).value = data.resumen.cantidad_compras
  startRow++

  worksheet.getCell(`A${startRow}`).value = 'Promedio por orden:'
  worksheet.getCell(`B${startRow}`).value = data.resumen.promedio_compra
  worksheet.getCell(`B${startRow}`).numFmt = '$#,##0.00'
  startRow += 3

  // Tabla de datos
  worksheet.getCell(`A${startRow}`).value = 'DETALLE DE COMPRAS'
  worksheet.getCell(`A${startRow}`).font = { bold: true, size: 14 }
  startRow += 2

  // Encabezados
  const headers = [
    'N° Orden',
    'Proveedor',
    'Departamento',
    'Solicitante',
    'Fecha Compra',
    'Monto Total',
    'Estatus',
  ]
  headers.forEach((header, index) => {
    const cell = worksheet.getCell(startRow, index + 1)
    cell.value = header
    cell.font = { bold: true }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    }
  })
  startRow++

  // Datos
  data.compras.forEach((compra) => {
    worksheet.getCell(startRow, 1).value = compra.numero_orden
    worksheet.getCell(startRow, 2).value = compra.proveedor
    worksheet.getCell(startRow, 3).value = compra.departamento
    worksheet.getCell(startRow, 4).value = compra.solicitante
    worksheet.getCell(startRow, 5).value = new Date(compra.fecha_compra)
    worksheet.getCell(startRow, 5).numFmt = 'dd/mm/yyyy'
    worksheet.getCell(startRow, 6).value = compra.monto_total
    worksheet.getCell(startRow, 6).numFmt = '$#,##0.00'
    worksheet.getCell(startRow, 7).value = compra.estatus
    startRow++
  })

  // Ajustar ancho de columnas
  worksheet.columns.forEach((column) => {
    column.width = 15
  })
}

const generarContenidoSolicitudesExcel = async (worksheet, data, startRow) => {
  worksheet.getCell(`A${startRow}`).value = 'RESUMEN DE SOLICITUDES'
  worksheet.getCell(`A${startRow}`).font = { bold: true, size: 14 }
  startRow += 2

  worksheet.getCell(`A${startRow}`).value = 'Total solicitudes:'
  worksheet.getCell(`B${startRow}`).value = data.resumen.total_solicitudes
  startRow += 3

  // Tabla de solicitudes
  worksheet.getCell(`A${startRow}`).value = 'DETALLE DE SOLICITUDES'
  worksheet.getCell(`A${startRow}`).font = { bold: true, size: 14 }
  startRow += 2

  const headers = [
    'Folio',
    'Solicitante',
    'Departamento',
    'Fecha',
    'Tipo',
    'Urgencia',
    'Estatus',
  ]
  headers.forEach((header, index) => {
    const cell = worksheet.getCell(startRow, index + 1)
    cell.value = header
    cell.font = { bold: true }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    }
  })
  startRow++

  data.solicitudes.forEach((solicitud) => {
    worksheet.getCell(startRow, 1).value = solicitud.folio_solicitud
    worksheet.getCell(startRow, 2).value = solicitud.solicitante
    worksheet.getCell(startRow, 3).value = solicitud.departamento
    worksheet.getCell(startRow, 4).value = new Date(solicitud.fecha_creacion)
    worksheet.getCell(startRow, 4).numFmt = 'dd/mm/yyyy'
    worksheet.getCell(startRow, 5).value = solicitud.tipo_requisicion
    worksheet.getCell(startRow, 6).value = solicitud.urgencia
    worksheet.getCell(startRow, 7).value = solicitud.estatus
    startRow++
  })

  worksheet.columns.forEach((column) => {
    column.width = 15
  })
}

const generarContenidoRankingExcel = async (worksheet, data, startRow) => {
  worksheet.getCell(`A${startRow}`).value =
    `RANKING DE PROVEEDORES (${data.criterio.toUpperCase()})`
  worksheet.getCell(`A${startRow}`).font = { bold: true, size: 14 }
  startRow += 2

  // ✅ HEADERS CORREGIDOS: Sin RFC
  const headers = [
    'Posición',
    'Proveedor',
    'Volumen Compras',
    'Frecuencia Uso',
    'Promedio Orden',
    'Calificación Est.',
  ]
  headers.forEach((header, index) => {
    const cell = worksheet.getCell(startRow, index + 1)
    cell.value = header
    cell.font = { bold: true }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    }
  })
  startRow++

  // ✅ DATOS CORREGIDOS: Sin RFC
  data.ranking.forEach((proveedor, index) => {
    worksheet.getCell(startRow, 1).value = index + 1
    worksheet.getCell(startRow, 2).value = proveedor.proveedor
    worksheet.getCell(startRow, 3).value = proveedor.volumen_compras
    worksheet.getCell(startRow, 3).numFmt = '$#,##0.00'
    worksheet.getCell(startRow, 4).value = proveedor.frecuencia_uso
    worksheet.getCell(startRow, 5).value = proveedor.promedio_orden
    worksheet.getCell(startRow, 5).numFmt = '$#,##0.00'
    worksheet.getCell(startRow, 6).value = proveedor.calificacion_promedio
    worksheet.getCell(startRow, 6).numFmt = '0.00'
    startRow++
  })

  // Agregar resumen
  startRow += 2
  worksheet.getCell(`A${startRow}`).value = 'RESUMEN'
  worksheet.getCell(`A${startRow}`).font = { bold: true, size: 12 }
  startRow++

  worksheet.getCell(`A${startRow}`).value = 'Total proveedores:'
  worksheet.getCell(`B${startRow}`).value = data.total_proveedores
  startRow++

  worksheet.getCell(`A${startRow}`).value = 'Criterio:'
  worksheet.getCell(`B${startRow}`).value = data.criterio
  startRow++

  if (data.resumen) {
    worksheet.getCell(`A${startRow}`).value = 'Volumen total:'
    worksheet.getCell(`B${startRow}`).value = data.resumen.volumen_total
    worksheet.getCell(`B${startRow}`).numFmt = '$#,##0.00'
    startRow++

    worksheet.getCell(`A${startRow}`).value = 'Órdenes totales:'
    worksheet.getCell(`B${startRow}`).value = data.resumen.ordenes_totales
  }

  worksheet.columns.forEach((column) => {
    column.width = 15
  })
}

const generarCSVAvanzado = async (
  res,
  data,
  titulo,
  parametros,
  tipoReporte
) => {
  // Para CSV, usar la funcionalidad de Excel pero exportar como CSV
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Reporte')

  // Usar las mismas funciones de contenido pero para CSV
  switch (tipoReporte) {
    case 'compras_periodo':
      await generarContenidoComprasExcel(worksheet, data, 1)
      break
    case 'solicitudes_estatus':
      await generarContenidoSolicitudesExcel(worksheet, data, 1)
      break
    case 'ranking_proveedores':
      await generarContenidoRankingExcel(worksheet, data, 1)
      break
  }

  const fecha = new Date().toISOString().split('T')[0]
  const nombreArchivo = `${titulo.replace(/\s+/g, '_')}_${fecha}.csv`

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${nombreArchivo}"`
  )

  await workbook.csv.write(res)
  res.end()
}

// ===== EXPORTAR TODAS LAS FUNCIONES =====

module.exports = {
  // Reportes de compras
  getReporteComprasPeriodo,
  getReporteComprasDepartamentos,
  getRankingProveedores,
  getCumplimientoEntregas,

  // Reportes de solicitudes
  getReporteSolicitudesEstatus,
  getCuellosBottella,

  // Dashboard y utilidades
  getDashboardEjecutivo,
  exportarReporteAvanzado,

  // Funciones originales (mantener compatibilidad)
  getReporteCompras: getReporteComprasPeriodo, // Alias para compatibilidad
  getReporteSolicitudes: getReporteSolicitudesEstatus, // Alias para compatibilidad
  exportarReporte: exportarReporteAvanzado, // Alias para compatibilidad
}
