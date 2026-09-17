import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, webcrypto } from 'node:crypto';
import { createRequire } from 'node:module';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const { buildPurchaseUserData, buildMetaEvent, extractClientIp } = require('../nocte-backend/meta-capi.js');
const departments = require('../nocte-backend/paraguay-departments.json');
const hash = value => createHash('sha256').update(value).digest('hex');
const bundle = async entry => {
  const result = await build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', write: false, logLevel: 'silent' });
  const module = { exports: {} };
  new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, require);
  return module.exports;
};
const matching = await bundle('src/lib/meta-matching.ts');
const req = (hint, observed = '181.120.10.10') => ({ headers: { 'x-forwarded-for': observed }, body: { client_ipv6: hint } });

test('all mapped cities hash identically in browser and server; surname survives', async () => {
  globalThis.window = { crypto: webcrypto };
  globalThis.document = { cookie: '' };
  const seen = new Set();
  for (const [department, cities] of Object.entries(departments)) {
    for (const city of cities) {
      assert.equal(seen.has(city), false, `duplicate city ${city}`);
      seen.add(city);
      const user = buildPurchaseUserData({ city, name: 'Ana Ramírez' });
      assert.equal(await matching.hashCity(city), user.ct, city);
      assert.equal(await matching.hashDepartment(city), user.st, `${city}: ${department}`);
      assert.equal(await matching.hashLastName('Ana Ramírez'), user.ln);
      assert.equal(user.country, await matching.hashCountry());
    }
  }
  assert.ok(seen.size > 90);
});

test('department lookup handles accents/case but never guesses ambiguous or partial text', async () => {
  const cases = [['SAN LORENZO', 'central'], ['  Ñemby ', 'central'], ['Yaguarón', 'paraguari'], ['Asunción', 'asuncion'], ['Ciudad del Este', 'altoparana']];
  for (const [city, expected] of cases) {
    assert.equal(buildPurchaseUserData({ city }).st, hash(expected));
    assert.equal(await matching.hashDepartment(city), hash(expected));
  }
  for (const city of ['', 'Bella Vista', 'Paraguay', 'San', 'Calle Luque 123', 'Asunción o Luque', null]) {
    assert.equal(buildPurchaseUserData({ city }).st, undefined);
    assert.equal(await matching.hashDepartment(city), undefined);
  }
  assert.equal(buildPurchaseUserData({ name: 'Ana' }).ln, undefined);
});

test('CAPI mirror keeps hashed location and surname without admitting plaintext or arbitrary data', () => {
  const body = { event_name: 'Purchase', event_id: 'unchanged-id', event_time: 1789625000, event_source_url: 'https://www.nocte.studio/',
    user_data: { ct: hash('luque'), st: hash('central'), country: hash('py'), ln: hash('ramírez'), fn: 'Ana', db: '20000101', client_ip_address: 'evil' },
    custom_data: { value: 249000, currency: 'PYG', order_id: 'unchanged-order' } };
  const event = buildMetaEvent(body, req());
  assert.equal(event.event_id, body.event_id);
  assert.deepEqual(event.custom_data, body.custom_data);
  assert.deepEqual(event.user_data, { ct: hash('luque'), st: hash('central'), country: hash('py'), ln: hash('ramírez'), client_ip_address: '181.120.10.10' });
});

test('IPv6 preference, native IP priority, invalid hints and kill switch', () => {
  const valid = '2800:abcd:12::5';
  assert.equal(extractClientIp(req(valid)), valid);
  assert.equal(extractClientIp(req(valid, '2800:abcd:34::6')), '2800:abcd:34::6');
  for (const hint of ['', undefined, {}, ['2800:abcd::1'], 'garbage', '::1', 'fc00::1', 'fe80::1', 'ff02::1', '2001:db8::1', '2001:0db8::1', '::ffff:181.120.10.10', '181.120.10.10', '2800::1%eth0', '2800::::1']) {
    assert.equal(extractClientIp(req(hint)), '181.120.10.10', JSON.stringify(hint));
  }
  process.env.META_CLIENT_IPV6 = 'off';
  try { assert.equal(extractClientIp(req(valid)), '181.120.10.10'); }
  finally { delete process.env.META_CLIENT_IPV6; }
});

test('IPv6 collection is background-only, one request, no cookies/referrer; expires', async () => {
  const ip = await bundle('src/lib/meta-ip.ts');
  const previousFetch = globalThis.fetch;
  const previousNow = Date.now;
  let calls = 0, resolve;
  globalThis.fetch = (url, options) => {
    calls++;
    assert.equal(url, 'https://api6.ipify.org');
    assert.equal(options.credentials, 'omit');
    assert.equal(options.referrerPolicy, 'no-referrer');
    return new Promise(r => { resolve = r; });
  };
  try {
    assert.equal(ip.collectClientIpv6(), undefined);
    assert.equal(ip.getClientIpv6(), undefined, 'no waiting before sending an order');
    ip.collectClientIpv6();
    assert.equal(calls, 1);
    resolve(new Response('2800:ABCD:12::5'));
    await new Promise(r => setImmediate(r));
    assert.equal(ip.getClientIpv6(), '2800:abcd:12::5');
    Date.now = () => previousNow() + 6 * 60 * 1000;
    assert.equal(ip.getClientIpv6(), undefined);
  } finally { globalThis.fetch = previousFetch; Date.now = previousNow; }
});

test('IPv4-only, blocked, malformed, and timeout lookup all preserve fallback', async () => {
  const previousFetch = globalThis.fetch;
  try {
    for (const value of ['181.120.10.10', 'bad', '::1', '2001:db8::1', '2800::::1']) {
      const ip = await bundle('src/lib/meta-ip.ts');
      globalThis.fetch = async () => new Response(value);
      ip.collectClientIpv6();
      await new Promise(r => setImmediate(r));
      assert.equal(ip.getClientIpv6(), undefined);
    }
    const ip = await bundle('src/lib/meta-ip.ts');
    globalThis.fetch = (_, { signal }) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error('timeout'))));
    ip.collectClientIpv6();
    await new Promise(r => setTimeout(r, 1600));
    assert.equal(ip.getClientIpv6(), undefined);
  } finally { globalThis.fetch = previousFetch; }
});
