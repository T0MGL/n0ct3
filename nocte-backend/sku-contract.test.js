/**
 * Regression tests for the color -> SKU contract.
 * Run: node --test sku-contract.test.js
 *
 * Born from the Aug 2026 wrong-color bug: orders landed as Rojo when the
 * customer picked another color. The frontend selection wiring was the root
 * cause, but resolveColors also padded short arrays with rojo, silently
 * turning a truncated amarillo cart into a mixed pack with rojo units.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  resolveColors,
  normalizeColor,
  buildProductLineItem,
  buildOrdefyItems,
  describeOrderForN8n,
} = require('./server');

test('single lens keeps the chosen color', () => {
  const line = buildProductLineItem('suelto', ['naranja'], 229000);
  assert.equal(line.sku, 'NOCTE-GLASSES-NARANJA');
  assert.equal(line.bundle_selections, undefined);
});

test('short colors array pads with the chosen color, never rojo', () => {
  assert.deepEqual(resolveColors('pareja', ['amarillo']), ['amarillo', 'amarillo']);
  assert.deepEqual(resolveColors('oficina', ['naranja', 'naranja']), ['naranja', 'naranja', 'naranja']);
});

test('padded mono cart resolves to the mono pack SKU, not a mixed pack with rojo', () => {
  const line = buildProductLineItem('pareja', ['amarillo'], 349000);
  assert.equal(line.sku, 'NOCTE-YGLASSES-PAREJA');
  assert.equal(line.bundle_selections, undefined, 'padding with rojo would force bundle_selections here');
});

test('empty colors still defaults to rojo (legacy carts)', () => {
  assert.deepEqual(resolveColors('suelto', undefined), ['rojo']);
  assert.deepEqual(resolveColors('pareja', []), ['rojo', 'rojo']);
});

test('mixed picks preserve per-unit composition', () => {
  const line = buildProductLineItem('oficina', ['rojo', 'naranja', 'amarillo'], 489000);
  const composition = line.bundle_selections.map((s) => `${s.sku}:${s.quantity}`).sort();
  assert.deepEqual(composition, [
    'NOCTE-GLASSES-AMARILLO:1',
    'NOCTE-GLASSES-NARANJA:1',
    'NOCTE-GLASSES-ROJO:1',
  ]);
});

test('normalizeColor accepts es/en spellings and falls back to rojo on garbage', () => {
  assert.equal(normalizeColor('Amarillo'), 'amarillo');
  assert.equal(normalizeColor('orange'), 'naranja');
  assert.equal(normalizeColor('fuxia'), 'rojo');
});

// Sept 2026: el antifaz paso a tener dos colores en Ordefy y NOCTE-SLEEPMASK-3D
// quedo como padre con variantes. Ordefy rechaza un padre con variantes
// (AMBIGUOUS_PARENT_SKU) y ese rechazo tumba la orden entera, lentes incluidos.
test('el antifaz sale con el SKU de la variante negra, nunca con el padre', () => {
  const items = buildOrdefyItems([
    { product: 'lentes', quantity: 1, amount: 249000, colors: ['rojo'] },
    { product: 'sleepmask', quantity: 1, amount: 119000 },
  ]);
  const mask = items.find((item) => item.sku.startsWith('NOCTE-SLEEPMASK'));
  assert.equal(mask.sku, 'NOCTE-SLEEPMASK-3D-NEGRO');
  assert.equal(mask.price, 119000);
  assert.equal(mask.name, 'NOCTE Sleep Mask 3D Negro');
  assert.ok(items.every((item) => item.sku !== 'NOCTE-SLEEPMASK-3D'));
});

// El texto para n8n lo lee el cliente en la plantilla de WhatsApp en espanol:
// tiene que decir antifaz, no el nombre de catalogo de Ordefy.
test('el texto para n8n nombra el antifaz como lo lee el cliente', () => {
  const text = describeOrderForN8n([
    { product: 'clipon', quantity: 1, amount: 189000 },
    { product: 'sleepmask', quantity: 1, amount: 119000 },
  ]);
  assert.match(text, /Antifaz 3D negro/);
  assert.doesNotMatch(text, /Sleep Mask/);
});
