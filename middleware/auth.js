const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'No autorizado, token requerido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findById(decoded.id).select('-password');

    if (!usuario || !usuario.activo) {
      return res.status(401).json({ message: 'No autorizado, usuario no existe o inactivo' });
    }

    req.usuario = usuario;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

const autorizarRol = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({ message: `Rol ${req.usuario.rol} sin permiso para esta acción` });
    }
    next();
  };
};

module.exports = { protect, autorizarRol };