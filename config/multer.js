const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const extensionesValidas = /jpeg|jpg|png|webp/;
  const extname = extensionesValidas.test(path.extname(file.originalname).toLowerCase());
  const mimetype = extensionesValidas.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, webp)'));
};

const uploadImagen = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = uploadImagen;