const sharp = require('sharp');
const { createWorker } = require('tesseract.js');

async function calcularNitidez(imageBuffer) {
  const { data, info } = await sharp(imageBuffer)
    .greyscale()
    .resize({ width: 400 })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const laplacian = [-1, -1, -1, -1, 8, -1, -1, -1, -1];

  let sum = 0;
  let sumSquared = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let result = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = (y + ky) * width + (x + kx);
          result += data[idx] * laplacian[(ky + 1) * 3 + (kx + 1)];
        }
      }
      sum += result;
      sumSquared += result * result;
      count++;
    }
  }

  const mean = count > 0 ? sum / count : 0;
  const variance = count > 0 ? sumSquared / count - mean * mean : 0;
  return variance;
}

async function ejecutarOCR(imageBuffer) {
  const worker = await createWorker('spa');
  try {
    const { data } = await worker.recognize(imageBuffer);
    return {
      texto: data.text,
      confianza: data.confidence || 0,
    };
  } finally {
    await worker.terminate();
  }
}

function unirResultadoOCR(texto, confianza) {
  const camposDetectados = {};

  const numeroFactura = texto.match(/[Ff]actura\s*(?:No\.?|Nº|#)?\s*[:.-]?\s*([A-Za-z0-9\-]+)/);
  const montoMatch = texto.match(/(?:TOTAL|Total|Monto|PAGAR|Debe)\s*[:.$\s]*([0-9,]+(?:\.\d{1,2})?)/);
  const ivaMatch = texto.match(/(?:IVA|I\.V\.A\.?)\s*[:.$\s]*([0-9,]+(?:\.\d{1,2})?)/);
  const fechaMatch = texto.match(/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/);

  if (numeroFactura) camposDetectados.numeroFactura = numeroFactura[1];
  if (montoMatch) camposDetectados.monto = parseFloat(montoMatch[1].replace(/,/g, ''));
  if (ivaMatch) camposDetectados.iva = parseFloat(ivaMatch[1].replace(/,/g, ''));
  if (fechaMatch) camposDetectados.fecha = fechaMatch[1];

  return camposDetectados;
}

async function analizarImagen(imageBuffer) {
  const nitidez = await calcularNitidez(imageBuffer);
  const umbralBorrosidad = parseInt(process.env.BLUR_THRESHOLD || '100', 10);
  const confianzaMinima = parseInt(process.env.OCR_MIN_CONFIDENCE || '70', 10);

  const esBorrosa = nitidez < umbralBorrosidad;

  let texto = '';
  let confianza = 0;
  let campos = {};

  if (!esBorrosa) {
    try {
      const resultado = await ejecutarOCR(imageBuffer);
      texto = resultado.texto;
      confianza = resultado.confianza;
      campos = unirResultadoOCR(texto, confianza);
    } catch (error) {
      console.error('Error en OCR:', error.message);
      esBorrosa = true;
    }
  }

  const confianzaAceptable = confianza >= confianzaMinima;

  return {
    nitidez,
    imagenBorrosa: esBorrosa,
    textoExtraido: texto,
    confianza,
    camposDetectados: campos,
    esAutomatica: !esBorrosa && confianzaAceptable,
    motivo: esBorrosa
      ? 'Imagen borrosa o ilegible'
      : !confianzaAceptable
      ? `Confianza OCR baja (${confianza.toFixed(0)}%)`
      : 'Procesada automaticamente',
  };
}

module.exports = { analizarImagen, ejecutarOCR, calcularNitidez };