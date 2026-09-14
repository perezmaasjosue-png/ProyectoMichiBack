const Factura = require('../models/Factura');
const { generarCuadrePDF } = require('../services/pdfService');

const getCuadre = async (req, res, next) => {
  try {
    const { desde, hasta, banco } = req.query;
    const filtro = {};

    if (desde || hasta) {
      filtro.fechaRecepcion = {};
      if (desde) filtro.fechaRecepcion.$gte = new Date(desde);
      if (hasta) filtro.fechaRecepcion.$lte = new Date(hasta);
    }
    if (banco) filtro['banco.nombre'] = banco;

    const facturas = await Factura.find(filtro).sort({ fechaRecepcion: 1 });

    const pendientes = facturas.filter((f) => f.estado === 'pendiente');
    const incluidas = facturas.filter((f) => f.estado === 'procesada' || f.estado === 'validada');
    const rechazadas = facturas.filter((f) => f.estado === 'rechazada');

    const monetarias = incluidas.map((f, i) => {
      const monto = f.monto || 0;
      const iva = f.montoIva || 0;
      return { _id: f._id, index: i + 1, numeroFactura: f.numeroFactura || '-', monto, iva };
    });

    const montoTotal = monetarias.reduce((acc, f) => acc + f.monto, 0);
    const ivaTotal = monetarias.reduce((acc, f) => acc + f.iva, 0);

    res.json({
      rango: { desde, hasta },
      banco: banco || null,
      totalFacturas: facturas.length,
      facturas: facturas.map((f) => ({
        _id: f._id,
        numeroFactura: f.numeroFactura,
        monto: f.monto,
        estado: f.estado,
        fechaRecepcion: f.fechaRecepcion,
        remitente: f.remitente,
      })),
      pendientes,
      incluidas: monetarias,
      rechazadas,
      resumen: {
        montoTotal,
        ivaTotal,
        granTotal: montoTotal + ivaTotal,
        cantidadIncluidas: incluidas.length,
        cantidadPendientes: pendientes.length,
      },
      bloqueadoPorPendientes: pendientes.length > 0,
    });
  } catch (error) {
    next(error);
  }
};

const getCuadrePDF = async (req, res, next) => {
  try {
    const { desde, hasta, banco } = req.query;

    if (!desde || !hasta) {
      return res.status(400).json({ message: 'Los parámetros desde y hasta son obligatorios' });
    }

    const filtro = {
      estado: { $in: ['procesada', 'validada'] },
      fechaRecepcion: { $gte: new Date(desde), $lte: new Date(hasta) },
    };
    if (banco) filtro['banco.nombre'] = banco;

    const pendientes = await Factura.countDocuments({
      fechaRecepcion: { $gte: new Date(desde), $lte: new Date(hasta) },
      estado: 'pendiente',
      ...(banco ? { 'banco.nombre': banco } : {}),
    });

    if (pendientes > 0) {
      return res.status(400).json({
        message: `El cuadre NO se puede generar: hay ${pendientes} factura(s) pendiente(s). Revise y complete los datos manualmente.`,
        pendingCount: pendientes,
      });
    }

    const facturas = await Factura.find(filtro).sort({ fechaRecepcion: 1 });

    if (facturas.length === 0) {
      return res.status(400).json({ message: 'No hay facturas válidas en el período seleccionado' });
    }

    const pdfBuffer = await generarCuadrePDF({
      banco: {
        nombre: banco || 'General',
        numeroCuenta: '',
      },
      fechaDesde: desde,
      fechaHasta: hasta,
      facturas,
      usuario: req.usuario,
    });

    await Factura.updateMany(
      { _id: { $in: facturas.map((f) => f._id) } },
      { $set: { pdfGenerado: true } }
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=cuadre_${desde}_${hasta}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

module.exports = { getCuadre, getCuadrePDF };