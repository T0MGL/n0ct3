/**
 * NOCTE Backend API - Development Server
 * Stripe Payment Processing for localhost
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== MIDDLEWARE ====================

// Parse JSON bodies
app.use(express.json());

// CORS Configuration for localhost development
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:8080',
      'http://localhost:8081',
      'http://localhost:8082',
      'http://localhost:8083',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:8081',
      'http://127.0.0.1:8082',
      'http://127.0.0.1:8083',
      'https://nocte.studio',           // ← AGREGAR
      'https://www.nocte.studio',       // ← AGREGAR
      'https://api.nocte.studio'   
    ];

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`⚠️  CORS blocked origin: ${origin}`);
      callback(null, true); // Allow in dev mode
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Request logging middleware (development only)
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ==================== ROUTES ====================

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'NOCTE Backend API is running',
    version: '1.0.0',
    stripe: !!process.env.STRIPE_SECRET_KEY
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    stripe_configured: !!process.env.STRIPE_SECRET_KEY
  });
});

// ==================== PAYMENT ENDPOINTS ====================

/**
 * POST /api/create-payment-intent
 * Creates a Stripe Payment Intent
 */
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    console.log('📝 Creating payment intent...');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    const { amount, currency, paymentMethodId, email, shipping, metadata } = req.body;

    // ========== VALIDATION ==========
    if (!amount || !currency) {
      console.error('❌ Missing required fields: amount or currency');
      return res.status(400).json({
        error: 'Amount and currency are required'
      });
    }

    if (!email) {
      console.error('❌ Missing required field: email');
      return res.status(400).json({
        error: 'Email is required'
      });
    }

    // paymentMethodId is optional when using Payment Element
    // It will be "pending" during initial setup

    // Validate amount ranges based on currency
    const currencyLower = currency.toLowerCase();
    let minAmount, maxAmount;

    if (currencyLower === 'pyg') {
      minAmount = 1000;      // 1,000 Gs
      maxAmount = 10000000;  // 10,000,000 Gs
    } else if (currencyLower === 'usd') {
      minAmount = 50;        // $0.50
      maxAmount = 100000;    // $1,000
    } else {
      minAmount = 100;
      maxAmount = 100000;
    }

    if (amount < minAmount || amount > maxAmount) {
      console.error(`❌ Invalid amount: ${amount} (must be between ${minAmount} and ${maxAmount})`);
      return res.status(400).json({
        error: `Amount must be between ${minAmount} and ${maxAmount} ${currency.toUpperCase()}`
      });
    }

    // ========== CREATE PAYMENT INTENT ==========
    console.log(`💰 Processing: ${amount} ${currency.toUpperCase()} for ${email}`);

    const paymentIntentData = {
      amount: parseInt(amount),
      currency: currencyLower,
      receipt_email: email,
      description: 'NOCTE® Red-Tinted Glasses',
      metadata: {
        product: 'NOCTE Red-Tinted Glasses',
        environment: 'development',
        ...metadata
      },
      automatic_payment_methods: {
        enabled: true,
      },
    };

    // Only attach payment method and confirm if provided and not "pending"
    if (paymentMethodId && paymentMethodId !== 'pending') {
      paymentIntentData.payment_method = paymentMethodId;
      paymentIntentData.confirm = true;
    }

    // Add shipping information if provided
    if (shipping && shipping.name && shipping.address) {
      paymentIntentData.shipping = {
        name: shipping.name,
        address: {
          line1: shipping.address.line1 || '',
          line2: shipping.address.line2 || null,
          city: shipping.address.city || '',
          state: shipping.address.state || '',
          postal_code: shipping.address.postal_code || '',
          country: shipping.address.country || 'PY',
        }
      };
      console.log('📦 Shipping info added:', shipping.name);
    }

    // Create the payment intent
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

    console.log(`✅ Payment Intent created: ${paymentIntent.id}`);
    console.log(`   Status: ${paymentIntent.status}`);
    console.log(`   Amount: ${paymentIntent.amount} ${paymentIntent.currency.toUpperCase()}`);

    // TODO: Save to database
    // await saveOrderToDatabase({
    //   paymentIntentId: paymentIntent.id,
    //   amount,
    //   currency,
    //   email,
    //   status: paymentIntent.status,
    //   createdAt: new Date()
    // });

    // Return success response
    res.json({
      clientSecret: paymentIntent.client_secret,
      status: paymentIntent.status,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency
    });

  } catch (error) {
    console.error('❌ Error creating payment intent:', error.message);
    console.error('Full error:', error);

    // Handle Stripe-specific errors
    if (error.type === 'StripeCardError') {
      return res.status(400).json({
        error: 'Card was declined',
        details: error.message
      });
    }

    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({
        error: 'Invalid request to Stripe',
        details: error.message
      });
    }

    // Generic error response
    res.status(500).json({
      error: error.message || 'Failed to create payment intent',
      type: error.type || 'unknown_error'
    });
  }
});

/**
 * POST /api/geocode
 * Convert address to coordinates and Google Maps link
 */
app.post('/api/geocode', async (req, res) => {
  try {
    const { address, city } = req.body;

    if (!address && !city) {
      return res.status(400).json({
        error: 'Address or city is required'
      });
    }

    // If no Google Maps API key, return simple link
    if (!process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
      const fullAddress = address ? `${address}, ${city}` : city;
      const encodedAddress = encodeURIComponent(fullAddress);

      return res.json({
        googleMapsLink: `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
        address: fullAddress,
        usesFallback: true
      });
    }

    // Use Google Geocoding API for precise location
    const fullAddress = address ? `${address}, ${city}, Paraguay` : `${city}, Paraguay`;
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${process.env.GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(geocodeUrl);
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      const formattedAddress = data.results[0].formatted_address;

      return res.json({
        googleMapsLink: `https://www.google.com/maps?q=${location.lat},${location.lng}`,
        address: formattedAddress,
        lat: location.lat,
        lng: location.lng,
        usesFallback: false
      });
    } else {
      // Fallback to simple link if geocoding fails
      const encodedAddress = encodeURIComponent(fullAddress);
      return res.json({
        googleMapsLink: `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
        address: fullAddress,
        usesFallback: true
      });
    }
  } catch (error) {
    console.error('❌ Geocoding error:', error.message);

    // Fallback: return simple Google Maps search link
    const { address, city } = req.body;
    const fullAddress = address ? `${address}, ${city}` : city;
    const encodedAddress = encodeURIComponent(fullAddress);

    res.json({
      googleMapsLink: `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
      address: fullAddress,
      usesFallback: true,
      error: error.message
    });
  }
});

/**
 * POST /api/send-order
 * Send order data to n8n webhook
 */
app.post('/api/send-order', async (req, res) => {
  try {
    console.log('📦 Sending order to n8n...');
    console.log('Order data:', JSON.stringify(req.body, null, 2));

    const {
      name,
      phone,
      location,
      address,
      googleMapsLink,
      quantity,
      total,
      orderNumber,
      paymentIntentId,
      email
    } = req.body;

    // Validation
    if (!name || !phone || !location) {
      return res.status(400).json({
        error: 'Name, phone, and location are required'
      });
    }

    if (!process.env.N8N_WEBHOOK_URL) {
      console.error('❌ N8N_WEBHOOK_URL not configured');
      return res.status(500).json({
        error: 'Webhook URL not configured'
      });
    }

    // Prepare payload for n8n
    const webhookPayload = {
      orderNumber: orderNumber || `#NOCTE-${Date.now()}`,
      timestamp: new Date().toISOString(),
      customer: {
        name,
        phone,
        email: email || null
      },
      location: {
        city: location,
        address: address || '',
        googleMapsLink: googleMapsLink || null
      },
      order: {
        quantity: quantity || 1,
        product: 'NOCTE® Red Light Blocking Glasses',
        total: total || (quantity === 2 ? 420000 : 280000),
        currency: 'PYG'
      },
      payment: {
        method: 'stripe',
        status: 'succeeded',
        paymentIntentId: paymentIntentId || null
      },
      source: 'nocte-landing-page'
    };

    // Send to n8n
    const n8nResponse = await fetch(process.env.N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload)
    });

    if (!n8nResponse.ok) {
      throw new Error(`n8n webhook failed: ${n8nResponse.status} ${n8nResponse.statusText}`);
    }

    const n8nData = await n8nResponse.json().catch(() => ({}));

    console.log('✅ Order sent to n8n successfully');
    console.log('n8n response:', n8nData);

    res.json({
      success: true,
      message: 'Order sent to n8n successfully',
      orderNumber: webhookPayload.orderNumber,
      n8nResponse: n8nData
    });

  } catch (error) {
    console.error('❌ Error sending order to n8n:', error.message);
    console.error('Full error:', error);

    res.status(500).json({
      error: error.message || 'Failed to send order to n8n',
      success: false
    });
  }
});

/**
 * POST /api/webhook
 * Stripe webhook endpoint (for production use)
 */
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // Webhook secret is optional in development
  if (!webhookSecret) {
    console.warn('⚠️  Webhook secret not configured (skipping verification in dev)');
    return res.json({ received: true });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  console.log(`🔔 Webhook received: ${event.type}`);

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log(`✅ Payment succeeded: ${paymentIntent.id}`);
      console.log(`   Amount: ${paymentIntent.amount} ${paymentIntent.currency.toUpperCase()}`);
      console.log(`   Email: ${paymentIntent.receipt_email}`);

      // TODO: Update database
      // TODO: Send confirmation email
      // TODO: Update inventory
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log(`❌ Payment failed: ${failedPayment.id}`);
      console.log(`   Error: ${failedPayment.last_payment_error?.message}`);

      // TODO: Notify customer of failure
      break;

    case 'charge.succeeded':
      const charge = event.data.object;
      console.log(`💳 Charge succeeded: ${charge.id}`);
      break;

    default:
      console.log(`ℹ️  Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('💥 Unexpected error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ==================== SERVER START ====================

const server = app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('  🚀 NOCTE Backend API - Development Mode');
  console.log('═══════════════════════════════════════════');
  console.log(`  ✓ Server:        http://localhost:${PORT}`);
  console.log(`  ✓ Health Check:  http://localhost:${PORT}/api/health`);
  console.log(`  ✓ Environment:   ${process.env.NODE_ENV || 'development'}`);
  console.log(`  ✓ Stripe Key:    ${process.env.STRIPE_SECRET_KEY ? '✓ Configured' : '✗ Missing'}`);
  console.log('═══════════════════════════════════════════');
  console.log('');
  console.log('📝 Endpoints:');
  console.log('   POST /api/create-payment-intent');
  console.log('   POST /api/geocode');
  console.log('   POST /api/send-order');
  console.log('   POST /api/webhook');
  console.log('   GET  /api/health');
  console.log('');
  console.log('💡 Tip: Use Ctrl+C to stop the server');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✓ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✓ Server closed');
    process.exit(0);
  });
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Rejection:', err);
  // Don't exit in development
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});
