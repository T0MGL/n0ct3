/**
 * NOCTE - Stripe Backend Example
 *
 * Este es un ejemplo MÍNIMO de backend para procesar pagos con Stripe.
 *
 * INSTALACIÓN:
 * npm install express stripe cors dotenv
 *
 * USO:
 * 1. Crear archivo .env en la carpeta del backend:
 *    STRIPE_SECRET_KEY=sk_test_tu_key_aqui
 *    PORT=3000
 *
 * 2. Ejecutar:
 *    node backend-example.js
 *
 * IMPORTANTE: Este es solo un ejemplo básico.
 * Para producción, considera:
 * - Validación de datos más robusta
 * - Rate limiting
 * - Logging
 * - Error handling mejorado
 * - Base de datos para guardar órdenes
 * - Webhooks para confirmación de pagos
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082', 'http://localhost:8083'],
  credentials: true
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'NOCTE Stripe Backend is running' });
});

// Create Payment Intent endpoint
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency, paymentMethodId, email, shipping, metadata } = req.body;

    // Validación básica
    if (!amount || !currency) {
      return res.status(400).json({ error: 'Amount and currency are required' });
    }

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Validar que el monto sea razonable (prevenir fraude)
    const minAmount = currency.toLowerCase() === 'pyg' ? 1000 : 100; // 1000 Gs o $1.00
    const maxAmount = currency.toLowerCase() === 'pyg' ? 10000000 : 100000; // 10M Gs o $1000

    if (amount < minAmount || amount > maxAmount) {
      return res.status(400).json({
        error: `Amount must be between ${minAmount} and ${maxAmount}`
      });
    }

    console.log(`Creating payment intent: ${amount} ${currency.toUpperCase()} for ${email}`);

    // Crear Payment Intent
    const paymentIntentData = {
      amount: parseInt(amount),
      currency: currency.toLowerCase(),
      payment_method: paymentMethodId,
      receipt_email: email,
      metadata: {
        product: 'NOCTE Red-Tinted Glasses',
        ...metadata
      },
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
    };

    // Agregar shipping info si existe
    if (shipping) {
      paymentIntentData.shipping = shipping;
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

    console.log(`Payment Intent created: ${paymentIntent.id} - Status: ${paymentIntent.status}`);

    // TODO: Guardar en base de datos
    // await saveOrderToDatabase({
    //   paymentIntentId: paymentIntent.id,
    //   amount,
    //   currency,
    //   email,
    //   status: paymentIntent.status,
    //   createdAt: new Date()
    // });

    res.json({
      clientSecret: paymentIntent.client_secret,
      status: paymentIntent.status,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);

    res.status(400).json({
      error: error.message || 'Failed to create payment intent'
    });
  }
});

// Webhook endpoint para eventos de Stripe (opcional pero recomendado)
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn('Webhook secret not configured');
    return res.status(400).send('Webhook secret not configured');
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Manejar eventos
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log(`✅ Payment succeeded: ${paymentIntent.id}`);

      // TODO: Actualizar base de datos
      // TODO: Enviar email de confirmación
      // TODO: Notificar al sistema de inventario

      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log(`❌ Payment failed: ${failedPayment.id}`);

      // TODO: Notificar al cliente del fallo

      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

// Error handler global
app.use((err, req, res, next) => {
  console.error('Unexpected error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 NOCTE Stripe Backend');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Health check: http://localhost:${PORT}/api/health`);
  console.log(`✓ Stripe key configured: ${process.env.STRIPE_SECRET_KEY ? '✓' : '✗'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
});

// Manejo de errores de proceso
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});
