const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

const generarToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son obligatorios' });
    }

    const usuario = await Usuario.findOne({ email: email.toLowerCase() });

    if (!usuario || !(await usuario.compararPassword(password))) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    if (!usuario.activo) {
      return res.status(403).json({ message: 'Usuario desactivado' });
    }

    res.json({
      token: generarToken(usuario._id),
      usuario: {
        _id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        telefono: usuario.telefono,
      },
    });
  } catch (error) {
    next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const { nombre, email, password, telefono, rol } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ message: 'Nombre, email y contraseña son obligatorios' });
    }

    const existe = await Usuario.findOne({ email: email.toLowerCase() });
    if (existe) {
      return res.status(400).json({ message: 'Ya existe un usuario con ese email' });
    }

    const usuario = await Usuario.create({
      nombre,
      email,
      password,
      telefono,
      rol: rol || 'operador',
    });

    res.status(201).json({
      token: generarToken(usuario._id),
      usuario: {
        _id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        telefono: usuario.telefono,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const usuario = await Usuario.findById(req.usuario._id).select('-password -__v');
    res.json(usuario);
  } catch (error) {
    next(error);
  }
};

module.exports = { login, register, getMe, generarToken };