require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Usuario = require('../models/Usuario');

const crearAdmin = async () => {
  await connectDB();

  const email = process.argv[2] || 'admin@michi.com';
  const password = process.argv[3] || 'admin123';
  const nombre = process.argv[4] || 'Administrador';

  const existe = await Usuario.findOne({ email: email.toLowerCase() });
  if (existe) {
    console.log(`El usuario ${email} ya existe, no se duplicó.`);
    mongoose.disconnect();
    return;
  }

  await Usuario.create({ nombre, email, password, rol: 'admin' });
  console.log(`Admin creado: ${email} / ${password}`);
  mongoose.disconnect();
};

crearAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});