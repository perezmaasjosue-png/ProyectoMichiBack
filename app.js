require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/facturas', require('./routes/facturaRoutes'));
app.use('/api/webhook', require('./routes/webhookRoutes'));

app.get('/', (req, res) => {
  res.json({ message: 'API Proyecto Michi funcionando' });
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.use(errorHandler);

module.exports = app;