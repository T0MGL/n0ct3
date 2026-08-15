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

const { resolveColors, normalizeColor, buildProductLineItem } = require('./server');

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
