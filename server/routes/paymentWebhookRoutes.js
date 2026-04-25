const express = require('express');
const { handlePayPalWebhook } = require('../controllers/paymentWebhookController');

const router = express.Router();

router.post('/paypal/webhook', handlePayPalWebhook);

module.exports = router;
