const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');
const Log = require('../models/logModel');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/payments/stripe/webhook', async (req, res) => {
  try {
    await paymentService.handleStripeWebhook(req.body, req.headers['stripe-signature']);
    res.sendStatus(200);
  } catch (error) {
    await Log.create({ type: 'error', module: 'PaymentController', message: `Stripe webhook error: ${error.message}` });
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

router.post('/payments/paypal/webhook', async (req, res) => {
  try {
    await paymentService.handlePaypalWebhook(req.body);
    res.sendStatus(200);
  } catch (error) {
    await Log.create({ type: 'error', module: 'PaymentController', message: `Paypal webhook error: ${error.message}` });
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

router.post('/pledges/:id/process', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod } = req.body;
    const processedPledge = await paymentService.processPledgePayment(id, paymentMethod);
    res.json(processedPledge);
  } catch (error) {
    await Log.create({ type: 'error', module: 'PaymentController', message: `Process pledge payment error: ${error.message}` });
    res.status(400).json({ message: error.message });
  }
});

router.post('/campaigns/:id/refund', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { pledgeId } = req.body;
    const refundResult = await paymentService.initiateRefund(id, pledgeId);
    res.json(refundResult);
  } catch (error) {
    await Log.create({ type: 'error', module: 'PaymentController', message: `Initiate refund error: ${error.message}` });
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
