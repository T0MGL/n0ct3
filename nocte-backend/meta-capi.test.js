/**
 * Server-side Purchase contract. Run: node --test meta-capi.test.js
 *
 * Two things must never drift here: the event_id convention shared with the
 * n8n WhatsApp flows (Meta dedup depends on it byte for byte) and the
 * /api/send-order response with META_SERVER_PURCHASE off, which has to stay
 * identical to what the storefront gets today.
 */

const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

process.env.ORDEFY_WEBHOOK_URL = 'https://ordefy.test/api/webhook/orders/store';
process.env.ORDEFY_API_KEY = 'test-key';
process.env.META_CAPI_PIXEL_ID = '1';
process.env.META_CAPI_ACCESS_TOKEN = 'test-token';

const { purchaseEventId, normalize, readFbIds, buildPurchaseUserData } = require('./meta-capi');
const app = require('./server');

// dotenv may have loaded a real n8n URL from .env after the assignments above.
delete process.env.N8N_WEBHOOK_URL;
delete process.env.META_CAPI_TEST_EVENT_CODE;

// Copied verbatim from the n8n node "CAPI Build Payload" (Confirm Order,
// QLts98LT5bEuQMZ7). The [COD] and [Transfer] branches of the main workflow
// carry the same two lines.
const n8nEventId = (orderNumber) => {
  const cleanOrderNum = String(orderNumber).replace(/[^A-Za-z0-9]/g, '');
  return 'nocte-purchase-' + cleanOrderNum;
};

test('event_id matches the n8n convention byte for byte', () => {
  for (const n of ['ORD-20260823-a1b2c3', '#NOC-0823-1234', ' ORD-20260101-ffffff ', 'WA-1724371200000']) {
    assert.equal(purchaseEventId(n), n8nEventId(n));
  }
  assert.equal(purchaseEventId('ORD-20260823-a1b2c3'), 'nocte-purchase-ORD20260823a1b2c3');
});

test('phone normalizes to digits with country code', () => {
  assert.equal(normalize.phone('0981 123 456'), '595981123456');
  assert.equal(normalize.phone('+595 981 123456'), '595981123456');
  assert.equal(normalize.phone('981123456'), '595981123456');
  assert.equal(normalize.phone('5491155551234'), '5491155551234');
  assert.equal(normalize.phone(''), undefined);
});

test('names keep accents and inner spaces, city drops both', () => {
  assert.equal(normalize.name('  María José '), 'maría josé');
  assert.equal(normalize.name("O'Brien-Ramírez"), 'obrienramírez');
  assert.equal(normalize.city('Ciudad del Este'), 'ciudaddeleste');
  assert.equal(normalize.city('Asunción'), 'asuncion');
});

const fakeReq = (cookie) => ({ headers: cookie ? { cookie } : {} });

test('fbp/fbc: body accepted when well formed, cookie wins over body', () => {
  const body = { fbp: 'fb.1.1724371200000.1234567890', fbc: 'fb.1.1724371200000.IwAR0abc_XYZ-9' };
  assert.deepEqual(readFbIds(fakeReq(), body), body);

  assert.deepEqual(readFbIds(fakeReq(), { fbp: 'not-a-cookie', fbc: 'fb.1.x.y' }), { fbp: undefined, fbc: undefined });

  const cookie = '_fbp=fb.1.1700000000000.999; _fbc=fb.1.1700000000000.fromcookie';
  assert.deepEqual(readFbIds(fakeReq(cookie), body), {
    fbp: 'fb.1.1700000000000.999',
    fbc: 'fb.1.1700000000000.fromcookie',
  });
});

test('user_data hashes PII, uses the phone hash as external_id, omits empties', () => {
  const user = buildPurchaseUserData({ name: 'Ana', phone: '0981123456', city: 'Luque' });
  assert.match(user.ph, /^[a-f0-9]{64}$/);
  assert.equal(user.external_id, user.ph);
  assert.equal(user.fn, buildPurchaseUserData({ name: 'ana', phone: '0981123456', city: '' }).fn);
  assert.equal('ln' in user, false);
  assert.equal('em' in user, false);
  assert.equal('fbp' in user, false);
});

// ==================== /api/send-order ====================

const ORDER_BODY = {
  name: 'Ana Ramírez',
  phone: '0981123456',
  location: 'Asunción',
  address: 'Calle 1',
  quantity: 2,
  total: 349000,
  orderNumber: '#NOC-0823-4321',
  paymentType: 'COD',
  deliveryType: 'común',
  colors: ['rojo', 'amarillo'],
  fbp: 'fb.1.1724371200000.1234567890',
  fbc: 'fb.1.1724371200000.IwAR0abc',
};

const jsonResponse = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const ordefyCreated = () =>
  jsonResponse(201, {
    success: true,
    order_id: '7a1c0a5e-0000-4000-8000-000000000001',
    order_number: 'ORD-20260823-a1b2c3',
    customer_id: 'c1',
    message: 'Order created successfully',
  });

let metaCalls;
let metaReply;
let ordefyReply;
let server;
let port;

before(() => {
  server = app.listen(0);
  port = server.address().port;
});

after(() => server.close());

beforeEach(() => {
  metaCalls = [];
  metaReply = () => jsonResponse(200, { events_received: 1, fbtrace_id: 'trace' });
  ordefyReply = ordefyCreated;
  globalThis.fetch = async (url, init) => {
    const target = String(url);
    if (target.includes('graph.facebook.com')) {
      metaCalls.push({ body: JSON.parse(init.body), auth: init.headers.Authorization, url: target });
      return metaReply();
    }
    if (target.startsWith(process.env.ORDEFY_WEBHOOK_URL)) return ordefyReply();
    throw new Error(`unexpected fetch ${target}`);
  };
});

const sendOrder = (body, headers = {}) =>
  new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        port,
        path: '/api/send-order',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), ...headers },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => resolve({ status: res.statusCode, raw, json: JSON.parse(raw) }));
      },
    );
    req.on('error', reject);
    req.end(data);
  });

const LEGACY_RESPONSE = {
  success: true,
  message: 'Order processed successfully',
  orderNumber: ORDER_BODY.orderNumber,
  n8nResponse: { skipped: true, reason: 'N8N_WEBHOOK_URL not configured' },
  ordefyResponse: {
    success: true,
    data: {
      success: true,
      order_id: '7a1c0a5e-0000-4000-8000-000000000001',
      order_number: 'ORD-20260823-a1b2c3',
      customer_id: 'c1',
      message: 'Order created successfully',
    },
  },
};

test('flag off: response identical to today, Meta never called', async () => {
  delete process.env.META_SERVER_PURCHASE;
  const { status, raw } = await sendOrder(ORDER_BODY);
  assert.equal(status, 200);
  assert.equal(raw, JSON.stringify(LEGACY_RESPONSE));
  assert.equal(metaCalls.length, 0);
});

test('flag with any value other than "on" is off', async () => {
  process.env.META_SERVER_PURCHASE = 'true';
  const { raw } = await sendOrder(ORDER_BODY);
  assert.equal(raw, JSON.stringify(LEGACY_RESPONSE));
  assert.equal(metaCalls.length, 0);
});

test('flag on: emits Purchase after Ordefy and returns the n8n-compatible event id', async () => {
  process.env.META_SERVER_PURCHASE = 'on';
  const { json, raw } = await sendOrder(ORDER_BODY, {
    'x-forwarded-for': '181.120.10.10, 10.0.0.1',
    'user-agent': 'Mozilla/5.0 test',
    referer: 'https://nocte.studio/',
  });

  assert.deepEqual(json, { ...LEGACY_RESPONSE, purchaseEventId: 'nocte-purchase-ORD20260823a1b2c3' });
  assert.equal(metaCalls.length, 1);

  const call = metaCalls[0];
  assert.equal(call.auth, 'Bearer test-token');
  assert.equal(call.url.includes('test-token'), false, 'token must not travel in the URL');
  assert.equal('test_event_code' in call.body, false);

  const event = call.body.data[0];
  assert.equal(event.event_name, 'Purchase');
  assert.equal(event.event_id, 'nocte-purchase-ORD20260823a1b2c3');
  assert.equal(event.action_source, 'website');
  assert.equal(event.event_source_url, 'https://nocte.studio/');
  assert.equal(event.user_data.client_ip_address, '181.120.10.10');
  assert.equal(event.user_data.client_user_agent, 'Mozilla/5.0 test');
  assert.equal(event.user_data.fbp, ORDER_BODY.fbp);
  assert.equal(event.user_data.fbc, ORDER_BODY.fbc);
  assert.equal(event.user_data.external_id, event.user_data.ph);
  assert.deepEqual(event.custom_data, {
    value: 349000,
    currency: 'PYG',
    content_name: 'NOCTE® Red Light Blocking Glasses - Pack x2',
    content_category: 'Sleep & Wellness',
    content_type: 'product',
    content_ids: ['nocte-red-glasses-2pack'],
    num_items: 2,
    order_id: 'ORD-20260823-a1b2c3',
  });

  const wire = JSON.stringify(call.body);
  assert.equal(wire.includes('981123456'), false, 'plaintext phone must never reach Meta');
  assert.equal(wire.includes('Ram'), false, 'plaintext name must never reach Meta');
  assert.equal(raw.includes('595981123456'), false);
});

test('flag on: Meta failure keeps the order OK and returns no event id', async () => {
  process.env.META_SERVER_PURCHASE = 'on';
  metaReply = () => jsonResponse(500, { error: { message: 'boom' } });
  const { json } = await sendOrder(ORDER_BODY);
  assert.deepEqual(json, LEGACY_RESPONSE);
});

test('flag on: Meta 200 without events_received returns no event id', async () => {
  process.env.META_SERVER_PURCHASE = 'on';
  metaReply = () => jsonResponse(200, { events_received: 0 });
  const { json } = await sendOrder(ORDER_BODY);
  assert.equal('purchaseEventId' in json, false);
});

test('flag on: Ordefy duplicate (replay) does not re-emit', async () => {
  process.env.META_SERVER_PURCHASE = 'on';
  ordefyReply = () =>
    jsonResponse(200, { success: true, duplicate: true, order_id: 'x', message: 'Order already processed' });
  const { json } = await sendOrder(ORDER_BODY);
  assert.equal(metaCalls.length, 0);
  assert.equal('purchaseEventId' in json, false);
});

test('flag on: Ordefy failure means no Purchase at all', async () => {
  process.env.META_SERVER_PURCHASE = 'on';
  ordefyReply = () => jsonResponse(500, { success: false, error: 'processing_error' });
  const { json } = await sendOrder(ORDER_BODY);
  assert.equal(json.success, false);
  assert.equal(metaCalls.length, 0);
});

test('flag on: malformed fbp/fbc in the body are dropped, cookie wins when present', async () => {
  process.env.META_SERVER_PURCHASE = 'on';
  await sendOrder({ ...ORDER_BODY, fbp: 'garbage', fbc: 'fb.1.abc.def' });
  assert.equal('fbp' in metaCalls[0].body.data[0].user_data, false);
  assert.equal('fbc' in metaCalls[0].body.data[0].user_data, false);

  await sendOrder(ORDER_BODY, { cookie: '_fbp=fb.1.1700000000000.42' });
  assert.equal(metaCalls[1].body.data[0].user_data.fbp, 'fb.1.1700000000000.42');
  assert.equal(metaCalls[1].body.data[0].user_data.fbc, ORDER_BODY.fbc);
});

test('flag on: test_event_code travels only when configured', async () => {
  process.env.META_SERVER_PURCHASE = 'on';
  process.env.META_CAPI_TEST_EVENT_CODE = 'TEST12345';
  await sendOrder(ORDER_BODY);
  delete process.env.META_CAPI_TEST_EVENT_CODE;
  assert.equal(metaCalls[0].body.test_event_code, 'TEST12345');
});
