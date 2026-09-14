const express = require('express');
const router = express.Router();
const {
  getAll,
  getById,
  getImagen,
  getPendientes,
  getRechazadas,
  crearManual,
  llenarManual,
  validar,
  rechazar,
  eliminar,
  uploadImagen,
} = require('../controllers/facturaController');
const { getCuadre, getCuadrePDF } = require('../controllers/cuadreController');
const { protect, autorizarRol } = require('../middleware/auth');
const uploadImagenMiddleware = require('../config/multer');

router.use(protect);

router.get('/', getAll);
router.get('/pendientes', getPendientes);
router.get('/rechazadas', getRechazadas);

router.get('/cuadre', getCuadre);
router.get('/cuadre/pdf', getCuadrePDF);

router.get('/:id/imagen', getImagen);
router.get('/:id', getById);

router.post('/', autorizarRol('admin', 'operador'), crearManual);
router.post('/upload', autorizarRol('admin', 'operador'), uploadImagenMiddleware.single('imagen'), uploadImagen);

router.put('/:id', autorizarRol('admin', 'operador'), llenarManual);
router.put('/:id/validar', autorizarRol('admin', 'operador'), validar);
router.put('/:id/rechazar', autorizarRol('admin', 'operador'), rechazar);

router.delete('/:id', autorizarRol('admin'), eliminar);

module.exports = router;