const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    const mensajes = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: 'Error de validación', errores: mensajes });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'ID inválido' });
  }

  if (err.code === 11000) {
    return res.status(400).json({ message: 'Ya existe un registro con ese valor único' });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Error interno del servidor',
  });
};

const notFound = (req, res, next) => {
  res.status(404).json({ message: `Ruta no encontrada: ${req.originalUrl}` });
};

module.exports = { errorHandler, notFound };