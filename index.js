const connectDB = require('./config/db');
const app = require('./app');

connectDB();

module.exports = app;