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
  buildN8nLines,
  readOrderLines,
  priceMismatches,
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
const itemsFor = (rawLines) => buildOrdefyItems(readOrderLines(rawLines).lines);

test('cada color del antifaz sale con el SKU de su variante, nunca con el padre', () => {
  const items = itemsFor([
    { product: 'lentes', quantity: 1, amount: 249000, colors: ['rojo'] },
    { product: 'sleepmask', color: 'negro', quantity: 1, amount: 119000 },
    { product: 'sleepmask', color: 'rosado', quantity: 1, amount: 119000 },
  ]);
  const masks = items.filter((item) => item.sku.startsWith('NOCTE-SLEEPMASK'));
  assert.deepEqual(masks.map((m) => `${m.sku} x${m.quantity} @${m.price} ${m.name}`), [
    'NOCTE-SLEEPMASK-3D-NEGRO x1 @119000 NOCTE Sleep Mask 3D Negro',
    'NOCTE-SLEEPMASK-3D-ROSADO x1 @119000 NOCTE Sleep Mask 3D Rosado',
  ]);
  assert.ok(items.every((item) => typeof item.sku === 'string' && item.sku !== 'NOCTE-SLEEPMASK-3D'));
});

// Un indice pelado sobre el catalogo acepta las claves de cualquier objeto: el
// item salia sin SKU y Ordefy tumbaba la orden entera.
test('colores y productos con nombre de propiedad del prototipo se separan', () => {
  for (const raw of [
    { product: 'sleepmask', color: 'constructor', quantity: 1, amount: 119000 },
    { product: 'sleepmask', color: '__proto__', quantity: 1, amount: 119000 },
    { product: 'constructor', quantity: 1, amount: 119000 },
    { product: 'toString', quantity: 1, amount: 119000 },
  ]) {
    const { lines, dropped } = readOrderLines([raw]);
    assert.equal(lines.length, 0, JSON.stringify(raw));
    assert.equal(dropped.length, 1, JSON.stringify(raw));
  }
});

test('dos negros y un rosado son dos items, uno por SKU con su cantidad', () => {
  const masks = itemsFor([
    { product: 'sleepmask', color: 'negro', quantity: 2, amount: 238000 },
    { product: 'sleepmask', color: 'rosado', quantity: 1, amount: 119000 },
  ]);
  assert.deepEqual(masks.map((m) => `${m.sku} x${m.quantity} @${m.price}`), [
    'NOCTE-SLEEPMASK-3D-NEGRO x2 @119000',
    'NOCTE-SLEEPMASK-3D-ROSADO x1 @119000',
  ]);
});

test('dos lineas del mismo color se juntan en un solo item', () => {
  const masks = itemsFor([
    { product: 'sleepmask', color: 'negro', quantity: 1, amount: 119000 },
    { product: 'sleepmask', color: 'negro', quantity: 1, amount: 119000 },
  ]);
  assert.deepEqual(masks.map((m) => `${m.sku} x${m.quantity}`), ['NOCTE-SLEEPMASK-3D-NEGRO x2']);
});

test('antifaz sin color es un checkout viejo y va negro; un color desconocido se separa', () => {
  const legacy = readOrderLines([{ product: 'sleepmask', quantity: 1, amount: 119000 }]);
  assert.equal(legacy.lines[0].color, 'negro');
  const unknown = readOrderLines([{ product: 'sleepmask', color: 'verde', quantity: 1, amount: 119000 }]);
  assert.equal(unknown.lines.length, 0);
  assert.match(unknown.dropped[0], /color de antifaz desconocido/);
  const garbage = readOrderLines([{ product: 'sleepmask', color: 7, quantity: 1, amount: 119000 }]);
  assert.equal(garbage.lines.length, 0);
});

// El texto para n8n lo lee el cliente en la plantilla de WhatsApp en espanol:
// tiene que decir antifaz y el color, no el nombre de catalogo de Ordefy.
test('el texto para n8n nombra el antifaz con su color, como lo lee el cliente', () => {
  const text = describeOrderForN8n(readOrderLines([
    { product: 'clipon', quantity: 1, amount: 189000 },
    { product: 'sleepmask', color: 'negro', quantity: 2, amount: 238000 },
    { product: 'sleepmask', color: 'rosado', quantity: 1, amount: 119000 },
  ]).lines);
  assert.equal(
    text,
    '1x NOCTE Clip-On Rojo + 2x NOCTE® Antifaz 3D negro para dormir + 1x NOCTE® Antifaz 3D rosado para dormir',
  );
  assert.doesNotMatch(text, /Sleep Mask/);
});

// Contrato con n8n (PR #8). El flujo de confirmacion por WhatsApp se construye
// contra esta forma: si este test falla, avisar antes de cambiarla.
test('contrato de order.lines para n8n: lentes + 2 antifaces negros + 1 rosado', () => {
  const { lines } = readOrderLines([
    { product: 'lentes', quantity: 2, amount: 389000, colors: ['amarillo', 'rojo'] },
    { product: 'sleepmask', color: 'negro', quantity: 2, amount: 238000 },
    { product: 'sleepmask', color: 'rosado', quantity: 1, amount: 119000 },
  ]);
  assert.deepEqual(buildN8nLines(lines), [
    {
      product: 'lentes',
      quantity: 2,
      amount: 389000,
      unit_price: 194500,
      sku: 'NOCTE-GLASSES-PAREJA',
      name: 'NOCTE® Lentes Anti-Luz Azul',
      colors: ['amarillo', 'rojo'],
    },
    {
      product: 'sleepmask',
      quantity: 2,
      amount: 238000,
      unit_price: 119000,
      sku: 'NOCTE-SLEEPMASK-3D-NEGRO',
      name: 'NOCTE® Antifaz 3D negro para dormir',
      color: 'negro',
    },
    {
      product: 'sleepmask',
      quantity: 1,
      amount: 119000,
      unit_price: 119000,
      sku: 'NOCTE-SLEEPMASK-3D-ROSADO',
      name: 'NOCTE® Antifaz 3D rosado para dormir',
      color: 'rosado',
    },
  ]);
  // El flujo nombra una linea que no conoce con el segmento de order.product
  // de su misma posicion: la linea i y el segmento i tienen que ser la misma.
  const segments = describeOrderForN8n(lines).split(' + ');
  assert.equal(segments.length, lines.length);
  buildN8nLines(lines)
    .filter((line) => line.product !== 'lentes')
    .forEach((line) => {
      const i = lines.findIndex((l) => l.product === line.product && l.color === line.color);
      assert.equal(segments[i], `${line.quantity}x ${line.name}`);
    });
  assert.match(segments[0], /^2x .*Glasses$/);
});

// Desde 6 es mayorista por WhatsApp. Un POST armado a mano al precio justo no
// tiene que poder armar lo que el checkout no arma: ni pidiendo de mas en una
// linea, ni partiendo por color, ni repitiendo lineas.
test('los topes son por pedido: antifaz 5 entre colores, una linea de lentes, clip-on y envio', () => {
  const check = (raw) => priceMismatches(readOrderLines(raw).lines);
  const mask = (color, quantity) => ({ product: 'sleepmask', color, quantity, amount: 119000 * quantity });
  const once = (product, amount) => ({ product, quantity: 1, amount });

  assert.deepEqual(check([mask('negro', 3), mask('rosado', 2)]), []);
  assert.match(check([mask('negro', 6)]).join(), /cantidad no vendible: sleepmask x6/);
  assert.match(check([mask('negro', 5), mask('rosado', 5)]).join(), /cantidad no vendible: sleepmask x10/);
  assert.match(check([{ product: 'clipon', quantity: 6, amount: 189000 * 6 }]).join(), /cantidad no vendible/);
  assert.match(check([once('clipon', 189000), once('clipon', 189000)]).join(), /clipon repetido en 2 lineas/);
  assert.match(check([once('envio-prioritario', 10000), once('envio-prioritario', 10000)]).join(), /envio-prioritario repetido/);
  const lens = { product: 'lentes', quantity: 3, amount: 549000, colors: ['rojo', 'rojo', 'rojo'] };
  assert.match(check([lens, lens]).join(), /lentes repetido en 2 lineas/);
});
