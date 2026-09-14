const mongoose = require('mongoose');

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log(
      `MongoDB conectado${conn.connection.host ? `: ${conn.connection.host}` : ''}`
    );
    return conn;
  } catch (error) {
    console.error(`Error conectando a MongoDB: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;