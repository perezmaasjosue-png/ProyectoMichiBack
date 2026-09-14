const express = require('express');
const router = express.Router();
const { recibirWhatsApp } = require('../controllers/webhookController');

router.post('/whatsapp/media', recibirWhatsApp);

router.get('/health', (req, res) => {
  res.json({ status: 'ok', servicio: 'proyecto-michi-backend' });
});

module.exports = router;