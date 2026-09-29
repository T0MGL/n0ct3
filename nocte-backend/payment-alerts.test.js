const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

// Firma con un secreto de prueba: el webhook se ejercita entero sin hablar con
// Stripe. Cualquier fetch saliente (Ordefy, n8n, Meta) hace fallar el test.
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_nocte_test_only';
const Stripe = require('stripe');
const app = require('./server');
const { succeededPaymentLog, paymentWithoutOrderAlert, verifyPaymentWithoutOrder } = require('./payment-alerts');

const intent = (overrides = {}) => ({
  id: 'pi_3QxRedirect01',
  object: 'payment_intent',
  amount: 458000,
  currency: 'pyg',
  status: 'succeeded',
  client_secret: 'pi_3QxRedirect01_secret_tR4nsFer',
  receipt_email: 'lucia@example.com',
  metadata: {
    orderNumber: '#NOC-0928-4417',
    customerName: 'Lucía Benítez',
    customerPhone: '0981 555 123',
    deliveryAddress: 'Av. Aviadores 1234',
  },
  ...overrides,
});

const PII = ['Lucía', '0981', 'Aviadores', 'lucia@example.com'];

test('el rastro de cada cobro se encuentra por pi y orderNumber y no lleva datos del cliente', () => {
  const line = succeededPaymentLog(intent());
  assert.equal(line, 'stripe.payment_succeeded pi=pi_3QxRedirect01 orderNumber=#NOC-0928-4417 amount=458000 PYG');
  for (const value of PII) assert.ok(!line.includes(value), value);
  assert.match(succeededPaymentLog(intent({ metadata: {} })), /orderNumber=sin-orden/);
});

test('la alerta de pago sin pedido es buscable y no lleva datos del cliente', () => {
  const alert = paymentWithoutOrderAlert(intent());
  assert.match(alert, /PAGO_SIN_PEDIDO pi=pi_3QxRedirect01 orderNumber=#NOC-0928-4417 amount=458000 PYG/);
  for (const value of PII) assert.ok(!alert.includes(value), value);
});

test('el aviso del navegador solo alerta un cobro real del que trae el client secret', async () => {
  const body = { paymentIntentId: 'pi_3QxRedirect01', clientSecret: 'pi_3QxRedirect01_secret_tR4nsFer' };
  const found = (pi) => async () => pi;

  assert.deepEqual(await verifyPaymentWithoutOrder({}, found(intent())), { status: 400 });
  assert.deepEqual(await verifyPaymentWithoutOrder({ ...body, paymentIntentId: 'ch_123' }, found(intent())), { status: 400 });
  assert.deepEqual(await verifyPaymentWithoutOrder({ ...body, clientSecret: '' }, found(intent())), { status: 400 });
  assert.deepEqual(
    await verifyPaymentWithoutOrder(body, async () => {
      throw Object.assign(new Error('No such payment_intent'), { code: 'resource_missing' });
    }),
    { status: 404 },
  );
  const stripeDown = await verifyPaymentWithoutOrder(body, async () => {
    throw new Error('connect ETIMEDOUT');
  });
  assert.equal(stripeDown.status, 502);
  assert.equal(stripeDown.alert, '🚨 PAGO_SIN_PEDIDO_NO_VERIFICADO pi=pi_3QxRedirect01. Revisar el cobro en Stripe.');
  assert.deepEqual(await verifyPaymentWithoutOrder({ ...body, clientSecret: 'pi_3QxRedirect01_secret_otro' }, found(intent())), {
    status: 403,
  });
  assert.deepEqual(await verifyPaymentWithoutOrder(body, found(intent({ status: 'processing' }))), { status: 409 });

  const ok = await verifyPaymentWithoutOrder(body, found(intent()));
  assert.equal(ok.status, 202);
  assert.match(ok.alert, /PAGO_SIN_PEDIDO/);
});

let server;
let baseUrl;
let outbound;
let logged;
const realFetch = globalThis.fetch;
const realLog = console.log;

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
});

beforeEach(() => {
  outbound = [];
  logged = [];
});

// El unico fetch permitido es el del test contra el server local.
const withGuards = async (fn) => {
  globalThis.fetch = async (url, init) => {
    if (String(url).startsWith(baseUrl)) return realFetch(url, init);
    outbound.push(String(url));
    throw new Error(`request no mockeado: ${url}`);
  };
  console.log = (...args) => logged.push(args.join(' '));
  try {
    return await fn();
  } finally {
    globalThis.fetch = realFetch;
    console.log = realLog;
  }
};

const postWebhook = (payload, signature) =>
  fetch(`${baseUrl}/api/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'stripe-signature': signature },
    body: payload,
  });

test('webhook firmado de payment_intent.succeeded: se verifica sobre el body crudo, deja rastro y no crea nada', async () => {
  const payload = JSON.stringify({ id: 'evt_1', object: 'event', type: 'payment_intent.succeeded', data: { object: intent() } });
  const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET });

  const response = await withGuards(() => postWebhook(payload, signature));

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { received: true });
  assert.ok(logged.some((line) => line.startsWith('stripe.payment_succeeded pi=pi_3QxRedirect01 orderNumber=#NOC-0928-4417')));
  for (const value of PII) assert.ok(!logged.join('\n').includes(value), value);
  assert.deepEqual(outbound, []);
});

test('webhook con firma invalida se rechaza', async () => {
  const payload = JSON.stringify({ id: 'evt_2', object: 'event', type: 'payment_intent.succeeded', data: { object: intent() } });
  const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret: 'whsec_otro' });

  const response = await withGuards(() => postWebhook(payload, signature));

  assert.equal(response.status, 400);
  assert.deepEqual(outbound, []);
});

test('el resto de las rutas sigue leyendo JSON', async () => {
  const response = await withGuards(() =>
    fetch(`${baseUrl}/api/payment-without-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentIntentId: 'no-es-un-pi', clientSecret: 'x' }),
    }),
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { received: false });
  assert.deepEqual(outbound, []);
});
