const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

function guardarImagen(buffer, jid, filename) {
  const fecha = new Date();
  const folder = fecha.toISOString().slice(0, 10).replace(/-/g, '');
  const dir = path.join(uploadDir, folder);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const safeJid = (jid || 'desconocido').replace(/[^a-zA-Z0-9]/g, '_');
  const name = filename || `${Date.now()}_${safeJid}.jpg`;
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, buffer);

  return {
    imageLocalPath: filePath,
    imageUrl: `/uploads/${folder}/${name}`,
  };
}

module.exports = { guardarImagen, uploadDir };