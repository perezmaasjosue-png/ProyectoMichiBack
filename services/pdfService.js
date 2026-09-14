const PDFDocument = require('pdfkit');

function formatearMoneda(valor) {
  return `$${Number(valor || 0).toFixed(2)}`;
}

function generarCuadrePDF({ banco, fechaDesde, fechaHasta, facturas, usuario }) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(20).text('CUADRE BANCARIO', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Banco: ${banco.nombre || '-'}`, { align: 'center' });
    doc.text(`Cuenta: ${banco.numeroCuenta || '-'}`, { align: 'center' });
    doc.text(`Período: ${new Date(fechaDesde).toLocaleDateString()} - ${new Date(fechaHasta).toLocaleDateString()}`, {
      align: 'center',
    });
    doc.text(`Generado por: ${usuario.nombre}`, { align: 'center' });
    doc.moveDown();
    doc.moveDown();

    let subtotal = 0;
    let ivaTotal = 0;

    const startX = 50;
    const tableWidth = 500;
    const colFactura = 100;
    const colProveedor = 180;
    const colMonto = 100;
    const colIva = 120;

    doc.font('Helvetica-Bold').fontSize(11);
    doc.text('Factura', startX, doc.y, { width: colFactura });
    doc.text('Proveedor', startX + colFactura, doc.y, { width: colProveedor });
    doc.text('Monto', startX + colFactura + colProveedor, doc.y, { width: colMonto });
    doc.text('IVA', startX + colFactura + colProveedor + colMonto, doc.y, { width: colIva, align: 'right' });
    doc.moveDown();
    doc.font('Helvetica').fontSize(10);

    let y = doc.y;
    doc.strokeColor('#cccccc');
    doc.moveTo(50, y).lineTo(550, y).stroke();
    doc.moveDown();

    facturas.forEach((factura) => {
      const monto = factura.monto || 0;
      const iva = factura.montoIva || 0;
      subtotal += monto;
      ivaTotal += iva;

      const numFactura = factura.numeroFactura || factura.datosManuales?.numeroFactura || '-';
      const proveedor = factura.datosManuales?.proveedor || factura.banco?.nombre || '-';

      doc.text(String(numFactura), startX, doc.y, { width: colFactura });
      doc.text(String(proveedor), startX + colFactura, doc.y, { width: colProveedor });
      doc.text(formatearMoneda(monto), startX + colFactura + colProveedor, doc.y, { width: colMonto });
      doc.text(formatearMoneda(iva), startX + colFactura + colProveedor + colMonto, doc.y, {
        width: colIva,
        align: 'right',
      });
      doc.moveDown();

      if (doc.y > 700) {
        doc.addPage();
        doc.font('Helvetica').fontSize(10);
      }
    });

    doc.moveDown();
    doc.strokeColor('#000000');
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    doc.font('Helvetica-Bold').fontSize(11);
    doc.text('SUBTOTAL:', { align: 'right' });
    doc.text(formatearMoneda(subtotal), 450, doc.y - doc.currentLineHeight(), { align: 'right' });
    doc.moveDown();

    doc.text(`IVA (${ivaTotal.toFixed(2)}):`, { align: 'right' });
    doc.moveDown();

    doc.fontSize(14);
    doc.text('TOTAL:', { align: 'right' });
    doc.text(formatearMoneda(subtotal + ivaTotal), 410, doc.y - doc.currentLineHeight(), { align: 'right' });
    doc.moveDown();
    doc.moveDown();

    doc.font('Helvetica').fontSize(9);
    doc.text(
      `Resumen: ${facturas.length} facturas procesadas - Sin facturas pendientes.`,
      { align: 'center' }
    );

    doc.end();
  });
}

module.exports = { generarCuadrePDF };