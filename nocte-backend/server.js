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
        allow_redirects: 'never', // Disable Link and other redirect-based payment methods
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
 * POST /api/reverse-geocode
 * Convert GPS coordinates to human-readable address
 */
app.post('/api/reverse-geocode', async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({
        error: 'Latitude and longitude are required'
      });
    }

    // Validate coordinates
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        error: 'Invalid coordinates'
      });
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        error: 'Coordinates out of valid range'
      });
    }

    // If no Google Maps API key, return fallback with coordinates
    if (!process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
      console.log('⚠️ No Google Maps API key - using fallback location');
      return res.json({
        address: 'Paraguay',
        city: 'Paraguay',
        formattedAddress: 'Paraguay',
        lat: latitude,
        lng: longitude,
        usesFallback: true,
        googleMapsLink: `https://www.google.com/maps?q=${latitude},${longitude}`
      });
    }

    // Use Google Reverse Geocoding API for precise address
    const reverseGeocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.GOOGLE_MAPS_API_KEY}&language=es`;

    console.log(`🔍 Reverse geocoding: ${latitude}, ${longitude}`);

    const response = await fetch(reverseGeocodeUrl);
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      const formattedAddress = result.formatted_address;

      // Extract city from address components
      let city = 'Paraguay';
      let locality = null;

      for (const component of result.address_components) {
        if (component.types.includes('locality')) {
          locality = component.long_name;
        } else if (component.types.includes('administrative_area_level_2')) {
          city = component.long_name;
        } else if (component.types.includes('administrative_area_level_1') && !locality) {
          city = component.long_name;
        }
      }

      // Prefer locality over administrative areas
      if (locality) {
        city = locality;
      }

      console.log(`✅ Reverse geocoded to: ${city}, ${formattedAddress}`);

      return res.json({
        address: formattedAddress,
        city: city,
        formattedAddress: formattedAddress,
        lat: latitude,
        lng: longitude,
        usesFallback: false,
        googleMapsLink: `https://www.google.com/maps?q=${latitude},${longitude}`
      });
    } else {
      // Fallback if reverse geocoding fails
      console.warn(`⚠️ Reverse geocoding failed: ${data.status}`);
      return res.json({
        address: 'Paraguay',
        city: 'Paraguay',
        formattedAddress: 'Paraguay',
        lat: latitude,
        lng: longitude,
        usesFallback: true,
        googleMapsLink: `https://www.google.com/maps?q=${latitude},${longitude}`
      });
    }
  } catch (error) {
    console.error('❌ Reverse geocoding error:', error.message);

    // Fallback: return coordinates only
    const { lat, lng } = req.body;
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    res.json({
      address: 'Paraguay',
      city: 'Paraguay',
      formattedAddress: 'Paraguay',
      lat: latitude,
      lng: longitude,
      usesFallback: true,
      googleMapsLink: `https://www.google.com/maps?q=${latitude},${longitude}`,
      error: error.message
    });
  }
});

// ==================== ORDEFY HELPER FUNCTIONS ====================

/**
 * Generate a unique idempotency key for Ordefy
 */
function generateOrdefyIdempotencyKey() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `nocte-order-${timestamp}-${random}`;
}

/**
 * Build Ordefy shipping address from order data
 * Prefers Google Maps URL if coordinates are available
 */
function buildOrdefyShippingAddress({ lat, long, address, city, googleMapsLink, reference }) {
  // If we have coordinates or Google Maps link, use that (most accurate)
  if (lat && long) {
    return {
      google_maps_url: `https://www.google.com/maps?q=${lat},${long}`,
      notes: reference || address || undefined,
    };
  }

  if (googleMapsLink) {
    return {
      google_maps_url: googleMapsLink,
      notes: reference || address || undefined,
    };
  }

  // Otherwise, use manual address
  return {
    address: address || city,
    city: city,
    reference: reference || undefined,
  };
}

/**
 * Calculate unit price based on quantity
 */
function getUnitPrice(quantity, total) {
  // Known pricing structure
  const prices = {
    1: 199000,
    2: 299000,
    3: 429000,
  };

  // If total matches known price, calculate unit price
  if (prices[quantity] === total) {
    return Math.round(total / quantity);
  }

  // Otherwise, calculate from total
  return Math.round(total / quantity);
}

/**
 * Get SKU based on pack type
 * - 1 unit: Personal pack
 * - 2 units: Couple pack
 * - 3+ units: Office pack (bulk pricing)
 */
function getSku(quantity) {
  if (quantity === 1) return 'NOCTE-GLASSES-PERSONAL';
  if (quantity === 2) return 'NOCTE-GLASSES-PAREJA';
  return 'NOCTE-GLASSES-OFICINA'; // 3+ units
}

/**
 * Get product name based on quantity
 */
function getProductName(quantity) {
  if (quantity === 1) return 'NOCTE® Glasses - Personal';
  if (quantity === 2) return 'NOCTE® Glasses - Pack Pareja';
  return `NOCTE® Glasses - Pack Oficina (x${quantity})`;
}

/**
 * Send order to Ordefy webhook
 */
async function sendToOrdefy(orderData) {
  const {
    name,
    phone,
    email,
    location,
    address,
    lat,
    long,
    googleMapsLink,
    quantity,
    total,
    paymentType,
    isPaid,
    deliveryType,
  } = orderData;

  // Check if Ordefy is configured
  if (!process.env.ORDEFY_WEBHOOK_URL || !process.env.ORDEFY_API_KEY) {
    console.warn('⚠️ Ordefy not configured (ORDEFY_WEBHOOK_URL or ORDEFY_API_KEY missing)');
    return { success: false, error: 'Ordefy not configured' };
  }

  const unitPrice = getUnitPrice(quantity || 1, total);
  const shippingCost = deliveryType === 'premium' ? 10000 : 0;

  // Determine payment status
  // Card payments are always paid, COD is pending payment
  const paymentStatus = isPaid === true || paymentType === 'Card' ? 'paid' : 'pending';

  // Build Ordefy payload
  const ordefyPayload = {
    idempotency_key: generateOrdefyIdempotencyKey(),
    customer: {
      name,
      phone: phone || undefined,
      email: email || undefined,
    },
    shipping_address: buildOrdefyShippingAddress({
      lat,
      long,
      address,
      city: location,
      googleMapsLink,
    }),
    items: [
      {
        sku: getSku(quantity || 1),
        name: getProductName(quantity || 1),
        quantity: quantity || 1,
        price: unitPrice,
      },
    ],
    totals: {
      subtotal: unitPrice * (quantity || 1),
      shipping: shippingCost,
      total: total,
    },
    payment_method: paymentType === 'Card' ? 'online' : 'cash_on_delivery',
    payment_status: paymentStatus,
  };

  console.log('📤 Sending to Ordefy:', JSON.stringify(ordefyPayload, null, 2));

  try {
    const response = await fetch(process.env.ORDEFY_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.ORDEFY_API_KEY,
      },
      body: JSON.stringify(ordefyPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Ordefy API error:', response.status, errorText);
      return { success: false, error: `Ordefy API error: ${response.status}` };
    }

    const result = await response.json();
    console.log('✅ Ordefy response:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('❌ Ordefy request failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * POST /api/send-order
 * Send order data to n8n webhook AND Ordefy
 */
app.post('/api/send-order', async (req, res) => {
  try {
    console.log('📦 Sending order to n8n and Ordefy...');
    console.log('Order data:', JSON.stringify(req.body, null, 2));

    const {
      name,
      phone,
      location,
      address,
      lat,
      long,
      googleMapsLink,
      quantity,
      total,
      orderNumber,
      paymentIntentId,
      email,
      paymentType,
      isPaid,
      deliveryType
    } = req.body;

    // Validation
    if (!name || !phone || !location) {
      return res.status(400).json({
        error: 'Name, phone, and location are required'
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
        total: total || (quantity === 2 ? 369000 : 249000),
        currency: 'PYG'
      },
      payment: {
        method: paymentType || 'stripe',
        status: isPaid === true || paymentType === 'Card' ? 'paid' : 'pending',
        isPaid: isPaid === true || paymentType === 'Card',
        paymentIntentId: paymentIntentId || null
      },
      source: 'nocte-landing-page'
    };

    // Send to both n8n and Ordefy in parallel
    const results = await Promise.allSettled([
      // Send to n8n (if configured)
      process.env.N8N_WEBHOOK_URL
        ? fetch(process.env.N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(webhookPayload)
          }).then(async (response) => {
            if (!response.ok) {
              throw new Error(`n8n webhook failed: ${response.status}`);
            }
            return response.json().catch(() => ({}));
          })
        : Promise.resolve({ skipped: true, reason: 'N8N_WEBHOOK_URL not configured' }),

      // Send to Ordefy
      sendToOrdefy({
        name,
        phone,
        email,
        location,
        address,
        lat,
        long,
        googleMapsLink,
        quantity,
        total,
        paymentType,
        isPaid,
        deliveryType,
      }),
    ]);

    const [n8nResult, ordefyResult] = results;

    // Process results
    let n8nSuccess = false;
    let n8nData = null;
    if (n8nResult.status === 'fulfilled') {
      n8nData = n8nResult.value;
      n8nSuccess = !n8nData.skipped;
      if (n8nSuccess) {
        console.log('✅ Order sent to n8n successfully');
      } else {
        console.log('⚠️ n8n skipped:', n8nData.reason);
      }
    } else {
      console.error('❌ n8n failed:', n8nResult.reason);
    }

    let ordefySuccess = false;
    let ordefyData = null;
    if (ordefyResult.status === 'fulfilled') {
      ordefyData = ordefyResult.value;
      ordefySuccess = ordefyData.success;
      if (ordefySuccess) {
        console.log('✅ Order sent to Ordefy successfully');
      } else {
        console.log('⚠️ Ordefy error:', ordefyData.error);
      }
    } else {
      console.error('❌ Ordefy failed:', ordefyResult.reason);
    }

    // Return success if at least one succeeded
    const overallSuccess = n8nSuccess || ordefySuccess;

    res.json({
      success: overallSuccess,
      message: overallSuccess
        ? 'Order processed successfully'
        : 'Failed to send order to any service',
      orderNumber: webhookPayload.orderNumber,
      n8nResponse: n8nData,
      ordefyResponse: ordefyData,
    });

  } catch (error) {
    console.error('❌ Error sending order:', error.message);
    console.error('Full error:', error);

    res.status(500).json({
      error: error.message || 'Failed to send order',
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
  console.log(`  ✓ n8n Webhook:   ${process.env.N8N_WEBHOOK_URL ? '✓ Configured' : '✗ Missing'}`);
  console.log(`  ✓ Ordefy:        ${process.env.ORDEFY_WEBHOOK_URL && process.env.ORDEFY_API_KEY ? '✓ Configured' : '✗ Missing'}`);
  console.log('═══════════════════════════════════════════');
  console.log('');
  console.log('📝 Endpoints:');
  console.log('   POST /api/create-payment-intent');
  console.log('   POST /api/geocode');
  console.log('   POST /api/reverse-geocode');
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
