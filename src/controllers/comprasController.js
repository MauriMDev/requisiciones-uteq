// ===== ARCHIVO: src/controllers/comprasController.js - CON SEQUELIZE =====
const { Op } = require('sequelize');
const { 
    Solicitud, 
    Usuario, 
    Departamento, 
    Compra,
    Factura,
    DocumentoAdjunto,
    sequelize 
} = require('../models');

class ComprasController {
    
    // Crear nueva compra
    async crearCompra(req, res) {
        const transaction = await sequelize.transaction();
        try {
            const {
                solicitud_id,
                proveedor_seleccionado,
                monto_total,
                fecha_compra,
                fecha_entrega_estimada,
                terminos_entrega,
                observaciones,
                facturas = []
            } = req.body;

            console.log(req.body);
            // Validaciones básicas
            if (!proveedor_seleccionado || !monto_total || !fecha_compra) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Nombre de proveedor, monto total y fecha de compra son campos requeridos'
                });
            }

            // Generar número de orden único
            const ultimaCompra = await sequelize.query(`
                SELECT COALESCE(MAX(CAST(SUBSTRING(numero_orden FROM '[0-9]+$') AS INTEGER)), 0) + 1 as siguiente_numero
                FROM compras 
                WHERE numero_orden ~ '^COM-[0-9]+$'
            `, { 
                type: sequelize.QueryTypes.SELECT, 
                transaction 
            });
            
            const numero_orden = `COM-${String(ultimaCompra[0].siguiente_numero).padStart(6, '0')}`;

            // Crear la compra
            const nuevaCompra = await Compra.create({
                numero_orden,
                solicitud_id: solicitud_id || null,
                proveedor_seleccionado,
                monto_total,
                fecha_compra,
                fecha_entrega_estimada,
                terminos_entrega,
                observaciones,
                estatus: 'ordenada',
                creado_por: req.user.id_usuario
            }, { transaction });

            // Procesar facturas si existen
            if (facturas && facturas.length > 0) {
                for (const factura of facturas) {
                    await Factura.create({
                        compra_id: nuevaCompra.id_compra,
                        folio_fiscal: factura.folio_fiscal || `FAC-${Date.now()}`,
                        monto_factura: factura.monto_factura || monto_total,
                        iva: factura.iva || 0,
                        total_factura: factura.total_factura || monto_total,
                        fecha_factura: factura.fecha_factura || fecha_compra,
                        estatus: 'pendiente'
                    }, { transaction });
                }
            }

            await transaction.commit();

            res.status(201).json({
                success: true,
                message: 'Compra creada exitosamente',
                data: nuevaCompra.toJSON()
            });

        } catch (error) {
            await transaction.rollback();
            console.error('Error al crear compra:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
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
                search
            } = req.query;

            const offset = (page - 1) * limit;
            
            // Construir condiciones WHERE
            const whereConditions = {};
            
            if (estatus) whereConditions.estatus = estatus;
            
            // Filtros de fecha
            if (fecha_inicio || fecha_fin) {
                whereConditions.fecha_compra = {};
                if (fecha_inicio) {
                    whereConditions.fecha_compra[Op.gte] = new Date(fecha_inicio);
                }
                if (fecha_fin) {
                    const fechaFin = new Date(fecha_fin);
                    fechaFin.setHours(23, 59, 59, 999);
                    whereConditions.fecha_compra[Op.lte] = fechaFin;
                }
            }
            
            // Búsqueda de texto
            if (search) {
                whereConditions[Op.or] = [
                    { numero_orden: { [Op.iLike]: `%${search}%` } },
                    { proveedor_seleccionado: { [Op.iLike]: `%${search}%` } }
                ];
            }

            // Consulta principal con Sequelize
            const { count, rows: compras } = await Compra.findAndCountAll({
                where: whereConditions,
                include: [
                    {
                        model: Solicitud,
                        as: 'solicitud',
                        attributes: ['folio_solicitud', 'descripcion_detallada'],
                        required: false
                    },
                    {
                        model: Usuario,
                        as: 'creador',
                        attributes: ['nombre_completo', 'numero_empleado']
                    }
                ],
                order: [['fecha_compra', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset),
                distinct: true
            });

            res.json({
                success: true,
                data: compras,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count,
                    pages: Math.ceil(count / limit)
                }
            });

        } catch (error) {
            console.error('Error al obtener compras:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Obtener compra por ID
    async obtenerCompraPorId(req, res) {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de compra no válido'
                });
            }

            const compra = await Compra.findOne({
                where: { id_compra: id },
                include: [
                    {
                        model: Solicitud,
                        as: 'solicitud',
                        attributes: ['folio_solicitud', 'descripcion_detallada', 'presupuesto_estimado'],
                        required: false
                    },
                    {
                        model: Usuario,
                        as: 'creador',
                        attributes: ['nombre_completo', 'numero_empleado', 'correo_institucional']
                    },
                    {
                        model: Factura,
                        as: 'facturas',
                        attributes: ['id_factura', 'folio_fiscal', 'monto_factura', 'total_factura', 'fecha_factura', 'estatus']
                    }
                ]
            });

            if (!compra) {
                return res.status(404).json({
                    success: false,
                    message: 'Compra no encontrada'
                });
            }

            res.json({
                success: true,
                data: compra.toJSON()
            });

        } catch (error) {
            console.error('Error al obtener compra:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Actualizar compra
    async actualizarCompra(req, res) {
        const transaction = await sequelize.transaction();
        try {
            const { id } = req.params;
            const {
                proveedor_seleccionado,
                monto_total,
                fecha_entrega_estimada,
                terminos_entrega,
                observaciones,
                estatus
            } = req.body;

            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de compra no válido'
                });
            }

            // Verificar que la compra existe
            const compra = await Compra.findByPk(id, { transaction });

            if (!compra) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Compra no encontrada'
                });
            }

            // Construir objeto de actualización
            const updateData = {};
            
            if (proveedor_seleccionado !== undefined) updateData.proveedor_seleccionado = proveedor_seleccionado;
            if (monto_total !== undefined) updateData.monto_total = monto_total;
            if (fecha_entrega_estimada !== undefined) updateData.fecha_entrega_estimada = fecha_entrega_estimada;
            if (terminos_entrega !== undefined) updateData.terminos_entrega = terminos_entrega;
            if (observaciones !== undefined) updateData.observaciones = observaciones;
            if (estatus !== undefined) updateData.estatus = estatus;

            if (Object.keys(updateData).length === 0) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'No se proporcionaron campos para actualizar'
                });
            }

            // Actualizar la compra
            await compra.update(updateData, { transaction });

            await transaction.commit();

            res.json({
                success: true,
                message: 'Compra actualizada exitosamente',
                data: compra.toJSON()
            });

        } catch (error) {
            await transaction.rollback();
            console.error('Error al actualizar compra:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Agregar factura a compra
    async agregarFactura(req, res) {
        const transaction = await sequelize.transaction();
        try {
            const { id } = req.params;
            const {
                folio_fiscal,
                monto_factura,
                iva,
                total_factura,
                fecha_factura
            } = req.body;

            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de compra no válido'
                });
            }

            // Verificar que la compra existe
            const compra = await Compra.findByPk(id, { transaction });

            if (!compra) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Compra no encontrada'
                });
            }

            // Crear la factura
            const nuevaFactura = await Factura.create({
                compra_id: id,
                folio_fiscal: folio_fiscal || `FAC-${Date.now()}`,
                monto_factura: monto_factura || compra.monto_total,
                iva: iva || 0,
                total_factura: total_factura || monto_factura || compra.monto_total,
                fecha_factura: fecha_factura || new Date(),
                estatus: 'pendiente'
            }, { transaction });

            await transaction.commit();

            res.status(201).json({
                success: true,
                message: 'Factura agregada exitosamente',
                data: nuevaFactura.toJSON()
            });

        } catch (error) {
            await transaction.rollback();
            console.error('Error al agregar factura:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Actualizar estado de factura
    async actualizarEstadoFactura(req, res) {
        const transaction = await sequelize.transaction();
        try {
            const { id, facturaId } = req.params;
            const { estatus } = req.body;

            if (!id || isNaN(id) || !facturaId || isNaN(facturaId)) {
                return res.status(400).json({
                    success: false,
                    message: 'IDs de compra y factura no válidos'
                });
            }

            // Validar estado
            const estadosValidos = ['pendiente', 'recibida', 'pagada', 'cancelada'];
            if (!estatus || !estadosValidos.includes(estatus)) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Estado de factura no válido'
                });
            }

            // Verificar que la factura existe
            const factura = await Factura.findOne({
                where: { 
                    id_factura: facturaId,
                    compra_id: id
                },
                transaction
            });

            if (!factura) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Factura no encontrada para esta compra'
                });
            }

            // Actualizar estado
            await factura.update({ estatus }, { transaction });

            await transaction.commit();

            res.json({
                success: true,
                message: 'Estado de factura actualizado',
                data: factura.toJSON()
            });

        } catch (error) {
            await transaction.rollback();
            console.error('Error al actualizar estado de factura:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
}

module.exports = new ComprasController();