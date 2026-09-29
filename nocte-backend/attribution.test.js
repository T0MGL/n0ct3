/**
 * Origen del pedido hacia Ordefy. Run: node --test attribution.test.js
 *
 * Lo que no puede cambiar: un pedido sin attribution sale a Ordefy byte por
 * byte como hoy, y ninguna attribution (valida o basura) llega a n8n ni tumba
 * un pedido.
 */

const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

process.env.ORDEFY_WEBHOOK_URL = 'https://ordefy.test/api/webhook/orders/store';
process.env.ORDEFY_API_KEY = 'test-key';

const { sanitizeAttribution, describeAttributionResult } = require('./attribution');
const app = require('./server');

// dotenv puede haber cargado URLs reales del .env despues de lo de arriba.
process.env.N8N_WEBHOOK_URL = 'https://n8n.test/webhook/nocte';
delete process.env.META_SERVER_PURCHASE;

const NOW = Date.parse('2026-09-28T20:20:00.000Z');

const META_TOUCH = {
  source: 'meta',
  utm_source: 'meta',
  utm_medium: 'paid_social',
  utm_campaign: '120111',
  utm_term: '120222',
  utm_content: '120333',
  click_ids: { fbclid: 'IwAR_test' },
  landing_page: 'https://www.nocte.studio/',
  captured_at: '2026-09-28T20:15:00.000Z',
  touch: 'last',
};

// ==================== sanitizeAttribution ====================

test('un toque valido pasa tal cual', () => {
  assert.deepEqual(sanitizeAttribution(META_TOUCH, NOW), META_TOUCH);
});

test('IDs numericos seguros pasan a string, los inseguros se descartan', () => {
  const result = sanitizeAttribution(
    { utm_source: 'meta', utm_campaign: 120111, utm_term: 120111222333444560, click_ids: { gclid: 42 } },
    NOW,
  );
  assert.deepEqual(result, { utm_source: 'meta', utm_campaign: '120111', click_ids: { gclid: '42' } });
});

test('solo keys del contrato: lo demas no sale', () => {
  const result = sanitizeAttribution(
    JSON.parse('{"utm_source":"meta","email":"a@b.com","ip":"1.2.3.4","user_agent":"x","fbp":"x","__proto__":{"x":1}}'),
    NOW,
  );
  assert.deepEqual(result, { utm_source: 'meta' });
  assert.equal(Object.getPrototypeOf(result), Object.prototype);
});

test('click ids prohibidos, mal formados, duplicados por mayusculas y mas de 10 keys', () => {
  const clickIds = {
    FBCLID: 'first',
    fbclid: 'second',
    fbp: 'fb.1.1.1',
    fbc: 'fb.1.1.x',
    ga: 'GA1.1',
    gid: 'GA1.2',
    access_token: 'x',
    my_session_id: 'x',
    csrf_cookie: 'x',
    passwd: 'x',
    oauth_code: 'x',
    stripe_api_key: 'x',
    client_secret: 'x',
    'bad-key': 'x',
    '1abc': 'x',
    gclid: 'has space',
    ttclid: 'x'.repeat(501),
    wbraid: 'ñ',
    msclkid: 'ms1',
  };
  assert.deepEqual(sanitizeAttribution({ click_ids: clickIds }, NOW), {
    click_ids: { fbclid: 'first', msclkid: 'ms1' },
  });

  const eleven = Object.fromEntries(Array.from({ length: 11 }, (_, i) => [`id_${i}`, `v${i}`]));
  assert.equal(Object.keys(sanitizeAttribution({ click_ids: eleven }, NOW).click_ids).length, 10);
});

test('texto: saca control e invisibles, recorta, descarta vacios y mas de 255', () => {
  const result = sanitizeAttribution(
    {
      utm_source: ' me\u200Bta\u0000 ',
      utm_medium: '   ',
      utm_campaign: 'a'.repeat(256),
      utm_content: '<script>alert(1)</script>',
    },
    NOW,
  );
  assert.deepEqual(result, { utm_source: 'meta', utm_content: '<script>alert(1)</script>' });
});

test('source: slug en minusculas o nada', () => {
  assert.equal(sanitizeAttribution({ source: 'Meta' }, NOW).source, 'meta');
  assert.equal(sanitizeAttribution({ source: 'meta ads', utm_source: 'x' }, NOW).source, undefined);
  assert.equal(sanitizeAttribution({ source: '-meta', utm_source: 'x' }, NOW).source, undefined);
});

test('URLs: solo origen y path, esquemas permitidos', () => {
  const result = sanitizeAttribution(
    {
      landing_page: 'https://user:pass@www.nocte.studio/sleep-mask?phone=0981#x',
      referrer: 'android-app://com.instagram.android/',
    },
    NOW,
  );
  assert.deepEqual(result, {
    landing_page: 'https://www.nocte.studio/sleep-mask',
    referrer: 'android-app://com.instagram.android/',
  });
  assert.equal(sanitizeAttribution({ referrer: 'javascript:alert(1)' }, NOW), undefined);
  assert.equal(sanitizeAttribution({ referrer: 'data:text/html,x' }, NOW), undefined);
  assert.equal(sanitizeAttribution({ referrer: '/relative' }, NOW), undefined);
});

test('captured_at: ISO con zona, a UTC; sin zona o en el futuro se descarta', () => {
  const at = (captured_at) => sanitizeAttribution({ utm_source: 'meta', captured_at }, NOW).captured_at;
  assert.equal(at('2026-09-28T17:15:00-03:00'), '2026-09-28T20:15:00.000Z');
  assert.equal(at('2026-09-28T20:15:00'), undefined);
  assert.equal(at('ayer'), undefined);
  assert.equal(at('2026-09-28T20:26:00Z'), undefined);
  assert.equal(at(1790000000000), undefined);
});

test('touch: first o last, nada mas', () => {
  assert.equal(sanitizeAttribution({ utm_source: 'meta', touch: 'first' }, NOW).touch, 'first');
  assert.equal(sanitizeAttribution({ utm_source: 'meta', touch: 'middle' }, NOW).touch, undefined);
});

test('sin ningun dato de origen no hay attribution', () => {
  for (const garbage of [
    undefined,
    null,
    'meta',
    42,
    true,
    [],
    [META_TOUCH],
    {},
    { captured_at: '2026-09-28T20:15:00Z', touch: 'last' },
    { utm_source: { nested: 'x' }, click_ids: 'fbclid=x', landing_page: 42 },
  ]) {
    assert.equal(sanitizeAttribution(garbage, NOW), undefined, JSON.stringify(garbage));
  }
});

test('mas de 8 KB o anidado sin fondo se descarta entero, sin tirar', () => {
  assert.equal(sanitizeAttribution({ utm_source: 'meta', padding: 'x'.repeat(9000) }, NOW), undefined);
  let deep = { utm_source: 'meta' };
  for (let i = 0; i < 100000; i += 1) deep = { deep };
  deep.utm_source = 'meta';
  assert.equal(sanitizeAttribution(deep, NOW), undefined);
});

test('el log de la respuesta de Ordefy lleva estado y codigos, nunca valores', () => {
  assert.equal(describeAttributionResult({ success: true }), undefined);
  assert.equal(describeAttributionResult({ attribution_status: 'stored' }), 'stored');
  assert.equal(
    describeAttributionResult({
      attribution_status: 'stored_with_warnings',
      attribution_warnings: [
        { field: 'attribution.landing_page', code: 'unsupported_url_scheme' },
        { code: 'too_large' },
        'basura',
      ],
    }),
    'stored_with_warnings (attribution.landing_page:unsupported_url_scheme, too_large)',
  );
});

// ==================== /api/send-order ====================

const ORDER_BODY = {
  name: 'Ana Ramírez',
  phone: '0981123456',
  location: 'Asunción',
  address: 'Calle 1',
  quantity: 1,
  total: 229000,
  orderNumber: '#NOC-0928-1111',
  paymentType: 'COD',
  deliveryType: 'común',
  colors: ['rojo'],
};

const jsonResponse = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

let calls;
let ordefyReply;
let server;
let port;

before(() => {
  server = app.listen(0);
  port = server.address().port;
});

after(() => server.close());

beforeEach(() => {
  calls = { ordefy: [], n8n: [] };
  ordefyReply = (body) =>
    jsonResponse(201, {
      success: true,
      order_id: 'o1',
      order_number: 'ORD-1',
      customer_id: 'c1',
      message: 'Order created successfully',
      ...(body.attribution ? { attribution_status: 'stored', attribution_warnings: [] } : {}),
    });
  globalThis.fetch = async (url, init) => {
    const target = String(url);
    if (target.startsWith(process.env.ORDEFY_WEBHOOK_URL)) {
      const body = JSON.parse(init.body);
      calls.ordefy.push({ raw: init.body, body });
      return ordefyReply(body);
    }
    if (target.startsWith(process.env.N8N_WEBHOOK_URL)) {
      calls.n8n.push({ raw: init.body, body: JSON.parse(init.body) });
      return jsonResponse(200, { ok: true });
    }
    throw new Error(`unexpected fetch ${target}`);
  };
});

const sendOrder = (body) =>
  new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        port,
        path: '/api/send-order',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => resolve({ status: res.statusCode, json: JSON.parse(raw) }));
      },
    );
    req.on('error', reject);
    req.end(data);
  });

// n8n lleva un timestamp del momento: se compara todo lo demas.
const n8nWithoutTimestamp = (call) => {
  const { timestamp, ...rest } = call.body;
  assert.equal(typeof timestamp, 'string');
  return rest;
};

test('sin attribution en el body: Ordefy no recibe la key', async () => {
  const { status, json } = await sendOrder(ORDER_BODY);
  assert.equal(status, 200);
  assert.equal(json.success, true);
  assert.equal(calls.ordefy.length, 1);
  assert.equal('attribution' in calls.ordefy[0].body, false);
  assert.equal(calls.ordefy[0].raw.includes('attribution'), false);
});

test('attribution valida: llega a Ordefy con los IDs como string y n8n no cambia', async () => {
  await sendOrder(ORDER_BODY);
  const baselineN8n = n8nWithoutTimestamp(calls.n8n[0]);
  const baselineOrdefy = calls.ordefy[0].body;
  calls = { ordefy: [], n8n: [] };

  const { json } = await sendOrder({
    ...ORDER_BODY,
    attribution: { ...META_TOUCH, utm_id: 120111, captured_at: new Date(Date.now() - 60000).toISOString() },
  });

  assert.equal(json.success, true);
  const sent = calls.ordefy[0].body.attribution;
  assert.equal(sent.utm_campaign, '120111');
  assert.equal(sent.utm_id, '120111');
  assert.equal(typeof sent.utm_id, 'string');
  assert.deepEqual(sent.click_ids, { fbclid: 'IwAR_test' });
  assert.equal(sent.touch, 'last');
  assert.equal(json.ordefyResponse.data.attribution_status, 'stored');

  const { attribution, ...rest } = calls.ordefy[0].body;
  assert.deepEqual(rest, baselineOrdefy);
  assert.deepEqual(n8nWithoutTimestamp(calls.n8n[0]), baselineN8n);
  assert.equal(calls.n8n[0].raw.includes('attribution'), false);
  assert.equal(calls.n8n[0].raw.includes('IwAR_test'), false);
});

test('attribution basura: el pedido se crea igual y sin la key', async () => {
  for (const garbage of [
    'meta',
    42,
    null,
    [META_TOUCH],
    { evil: 'x', click_ids: { fbp: 'fb.1.1.1', session: 'x' } },
    { utm_source: { $gt: '' }, landing_page: 'javascript:alert(1)' },
    { utm_source: 'meta', padding: 'x'.repeat(20000) },
  ]) {
    calls = { ordefy: [], n8n: [] };
    const { status, json } = await sendOrder({ ...ORDER_BODY, attribution: garbage });
    assert.equal(status, 200, JSON.stringify(garbage).slice(0, 80));
    assert.equal(json.success, true);
    assert.equal(calls.ordefy.length, 1);
    assert.equal('attribution' in calls.ordefy[0].body, false);
  }
});

test('Ordefy rechaza la attribution: el pedido sigue OK', async () => {
  ordefyReply = () =>
    jsonResponse(201, {
      success: true,
      order_id: 'o1',
      order_number: 'ORD-1',
      attribution_status: 'discarded',
      attribution_warnings: [{ field: 'attribution.utm_source', code: 'invalid_type' }],
    });
  const { status, json } = await sendOrder({ ...ORDER_BODY, attribution: META_TOUCH });
  assert.equal(status, 200);
  assert.equal(json.success, true);
});
