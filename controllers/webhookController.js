const Factura = require('../models/Factura');
const { analizarImagen } = require('../services/ocrService');
const { guardarImagen } = require('../services/storageService');
const { enviarConfirmacionMensaje } = require('../services/whatsappService');

const recibirWhatsApp = async (req, res, next) => {
  try {
    const { from, nombre, jid, esImagen, imagenBase64 } = req.body;

    if (!esImagen) {
      return res.status(200).json({ message: 'Mensaje recibido, no es imagen, ignorado' });
    }

    if (!imagenBase64) {
      return res.status(400).json({ message: 'Falta la imagen en base64' });
    }

    const buffer = Buffer.from(imagenBase64, 'base64');
    const resultado = await analizarImagen(buffer);

    const guardado = guardarImagen(buffer, jid || from || '', `wa_${Date.now()}.jpg`);

    const campos = resultado.camposDetectados;
    const datosFactura = {
      imageUrl: guardado.imageUrl,
      imageLocalPath: guardado.imageLocalPath,
      remitente: {
        nombre: nombre || '',
        numeroTelefono: from || '',
        waJid: jid || from || '',
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

    const estadoMensaje =
      factura.estado === 'pendiente'
        ? 'Factura recibida pero la imagen es borrosa o ilegible, queda pendiente de revisión.'
        : `Factura procesada correctamente.`;

    await enviarConfirmacionMensaje({
      numeroTelefono: from,
      acceso: jid || from,
      texto: estadoMensaje,
    });

    res.status(201).json({
      message: 'Imagen procesada',
      factura,
      pendiente: factura.estado === 'pendiente',
      motivo: resultado.motivo,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { recibirWhatsApp };