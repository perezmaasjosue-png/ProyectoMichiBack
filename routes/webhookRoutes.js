const express = require('express');
const router = express.Router();
const { recibirWhatsApp } = require('../controllers/webhookController');

const protegerWebhook = (req, res, next) => {
  const secreto = process.env.WEBHOOK_SECRET;
  if (!secreto) return next();

  const clave = req.headers['x-michi-key'] || req.query.key || req.body?.clave;
  if (!clave || clave !== secreto) {
    return res.status(401).json({ message: 'Clave inválida' });
  }
  next();
};

router.post('/whatsapp/media', protegerWebhook, recibirWhatsApp);

router.get('/health', (req, res) => {
  res.json({ status: 'ok', servicio: 'proyecto-michi-backend' });
});

module.exports = router;