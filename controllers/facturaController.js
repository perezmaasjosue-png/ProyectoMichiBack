const Factura = require('../models/Factura');
const { analizarImagen } = require('../services/ocrService');
const { guardarImagen } = require('../services/storageService');

const getAll = async (req, res, next) => {
  try {
    const { estado, desde, hasta, remitente, banco, numeroFactura } = req.query;
    const filtro = {};

    if (estado) filtro.estado = estado;
    if (banco) filtro['banco.nombre'] = banco;
    if (numeroFactura) filtro.numeroFactura = { $regex: numeroFactura, $options: 'i' };
    if (remitente) filtro['remitente.nombre'] = { $regex: remitente, $options: 'i' };

    if (desde || hasta) {
      filtro.fechaRecepcion = {};
      if (desde) filtro.fechaRecepcion.$gte = new Date(desde);
      if (hasta) filtro.fechaRecepcion.$lte = new Date(hasta);
    }

    const facturas = await Factura.find(filtro).sort({ fechaRecepcion: -1 }).limit(parseInt(req.query.limit) || 200);
    res.json(facturas);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const factura = await Factura.findById(req.params.id);
    if (!factura) {
      return res.status(404).json({ message: 'Factura no encontrada' });
    }
    res.json(factura);
  } catch (error) {
    next(error);
  }
};

const getPendientes = async (req, res, next) => {
  try {
    const facturas = await Factura.find({ estado: 'pendiente' }).sort({ fechaRecepcion: 1 });
    res.json(facturas);
  } catch (error) {
    next(error);
  }
};

const getRechazadas = async (req, res, next) => {
  try {
    const facturas = await Factura.find({ estado: 'rechazada' }).sort({ fechaRecepcion: -1 });
    res.json(facturas);
  } catch (error) {
    next(error);
  }
};

const crearManual = async (req, res, next) => {
  try {
    const factura = await Factura.create({
      numeroFactura: req.body.numeroFactura,
      monto: req.body.monto,
      montoIva: req.body.montoIva,
      fecha: req.body.fecha,
      datosManuales: {
        numeroFactura: req.body.numeroFactura,
        monto: req.body.monto,
        proveedor: req.body.proveedor,
        descripcion: req.body.descripcion,
      },
      banco: req.body.banco,
      estado: req.body.monto ? 'procesada' : 'pendiente',
      revisadoPor: req.usuario._id,
    });

    res.status(201).json(factura);
  } catch (error) {
    next(error);
  }
};

const llenarManual = async (req, res, next) => {
  try {
    const factura = await Factura.findById(req.params.id);
    if (!factura) {
      return res.status(404).json({ message: 'Factura no encontrada' });
    }

    const { numeroFactura, monto, montoIva, proveedor, fecha, banco, notas, descripcion } = req.body;

    if (numeroFactura) factura.numeroFactura = numeroFactura;
    if (monto !== undefined) factura.monto = monto;
    if (montoIva !== undefined) factura.montoIva = montoIva;
    if (fecha) factura.fecha = fecha;

    factura.datosManuales = {
      numeroFactura: numeroFactura || factura.datosManuales?.numeroFactura || '',
      monto: monto !== undefined ? monto : factura.datosManuales?.monto,
      proveedor: proveedor || factura.datosManuales?.proveedor || '',
      descripcion: descripcion || factura.datosManuales?.descripcion || '',
    };

    if (banco) {
      factura.banco = {
        nombre: banco.nombre || factura.banco?.nombre || '',
        numeroCuenta: banco.numeroCuenta || factura.banco?.numeroCuenta || '',
        tipoTransaccion: banco.tipoTransaccion || factura.banco?.tipoTransaccion || '',
      };
    }

    if (notas !== undefined) factura.notas = notas;
    factura.revisadoPor = req.usuario._id;

    if (factura.estado === 'pendiente' && factura.monto !== null) {
      factura.estado = 'procesada';
    }

    await factura.save();
    res.json(factura);
  } catch (error) {
    next(error);
  }
};

const validar = async (req, res, next) => {
  try {
    const factura = await Factura.findById(req.params.id);
    if (!factura) {
      return res.status(404).json({ message: 'Factura no encontrada' });
    }
    factura.estado = 'validada';
    factura.revisadoPor = req.usuario._id;
    await factura.save();
    res.json(factura);
  } catch (error) {
    next(error);
  }
};

const rechazar = async (req, res, next) => {
  try {
    const factura = await Factura.findById(req.params.id);
    if (!factura) {
      return res.status(404).json({ message: 'Factura no encontrada' });
    }
    factura.estado = 'rechazada';
    factura.motivoRechazo = req.body.motivo || 'Rechazada por el usuario';
    factura.revisadoPor = req.usuario._id;
    await factura.save();
    res.json(factura);
  } catch (error) {
    next(error);
  }
};

const eliminar = async (req, res, next) => {
  try {
    const factura = await Factura.findByIdAndDelete(req.params.id);
    if (!factura) {
      return res.status(404).json({ message: 'Factura no encontrada' });
    }
    res.json({ message: 'Factura eliminada', id: req.params.id });
  } catch (error) {
    next(error);
  }
};

const uploadImagen = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se recibió ninguna imagen' });
    }

    const imagenBuffer = req.file.buffer;
    const resultado = await analizarImagen(imagenBuffer);

    const guardado = guardarImagen(imagenBuffer, req.body.jid || '', req.file.originalname);

    const campos = resultado.camposDetectados;
    const datosFactura = {
      imageUrl: guardado.imageUrl,
      imageLocalPath: guardado.imageLocalPath,
      remitente: {
        nombre: req.body.remitente || '',
        numeroTelefono: req.body.numeroTelefono || '',
        waJid: req.body.jid || '',
      },
      ocrData: {
        textoExtraido: resultado.textoExtraido,
        confianza: resultado.confianza,
        camposDetectados: campos,
        nitidez: resultado.nitidez,
        imagenBorrosa: resultado.imagenBorrosa,
      },
    };

    if (resultado.esAutomatica) {
      datosFactura.numeroFactura = campos.numeroFactura || '';
      datosFactura.monto = campos.monto ?? null;
      datosFactura.montoIva = campos.iva ?? null;
      if (campos.fecha) datosFactura.fecha = new Date(campos.fecha);
      datosFactura.estado = campos.monto !== undefined ? 'procesada' : 'pendiente';
    } else {
      datosFactura.estado = 'pendiente';
    }

    const factura = await Factura.create(datosFactura);

    res.status(201).json({
      factura,
      analisis: {
        nitidez: resultado.nitidez,
        imagenBorrosa: resultado.imagenBorrosa,
        confianza: resultado.confianza,
        esAutomatica: resultado.esAutomatica,
        motivo: resultado.motivo,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  getPendientes,
  getRechazadas,
  crearManual,
  llenarManual,
  validar,
  rechazar,
  eliminar,
  uploadImagen,
};