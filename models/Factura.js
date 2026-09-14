const mongoose = require('mongoose');

const facturaSchema = new mongoose.Schema(
  {
    imageUrl: {
      type: String,
      default: null,
    },
    imageLocalPath: {
      type: String,
      default: null,
    },
    imagen: {
      type: String,
      select: false,
      default: null,
    },
    numeroFactura: {
      type: String,
      default: '',
    },
    monto: {
      type: Number,
      default: null,
    },
    montoIva: {
      type: Number,
      default: null,
    },
    fecha: {
      type: Date,
      default: null,
    },
    fechaRecepcion: {
      type: Date,
      default: Date.now,
    },
    remitente: {
      nombre: { type: String, default: '' },
      numeroTelefono: { type: String, default: '' },
      waJid: { type: String, default: '' },
    },
    estado: {
      type: String,
      enum: ['pendiente', 'procesada', 'rechazada', 'validada'],
      default: 'pendiente',
    },
    ocrData: {
      textoExtraido: { type: String, default: '' },
      confianza: { type: Number, default: 0 },
      camposDetectados: { type: Object, default: {} },
      nitidez: { type: Number, default: 0 },
      imagenBorrosa: { type: Boolean, default: false },
    },
    datosManuales: {
      numeroFactura: { type: String, default: '' },
      monto: { type: Number, default: null },
      proveedor: { type: String, default: '' },
      descripcion: { type: String, default: '' },
    },
    banco: {
      nombre: { type: String, default: '' },
      numeroCuenta: { type: String, default: '' },
      tipoTransaccion: { type: String, default: '' },
    },
    pdfGenerado: {
      type: Boolean,
      default: false,
    },
    notas: {
      type: String,
      default: '',
    },
    motivoRechazo: {
      type: String,
      default: '',
    },
    revisadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

facturaSchema.methods.estaListaParaCuadre = function () {
  return this.estado === 'procesada' || this.estado === 'validada';
};

module.exports = mongoose.model('Factura', facturaSchema);