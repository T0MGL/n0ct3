/**
 * Regression tests for the transactional email formatters.
 * Run: node --test emails-format.test.js
 *
 * Born from the Aug 2026 gate review: formatGuaranies chequeaba solo
 * Number.isFinite, y Number(null) es 0, así que un pedido sin total imprimía
 * "Gs. 0" al cliente en la línea y en el TOTAL. En la misma pasada apareció que
 * orderNumber llega crudo desde un endpoint público hasta el asunto del email y
 * la clave de idempotencia de Resend.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  formatGuaranies,
  firstName,
  groupLensLines,
  normalizeEmailAddress,
  sanitizeOrderReference,
} = require('./emails/format');

test('formatGuaranies usa el formato del sitio', () => {
  assert.equal(formatGuaranies(229000), 'Gs. 229.000');
  assert.equal(formatGuaranies(1247000), 'Gs. 1.247.000');
  assert.equal(formatGuaranies('229000'), 'Gs. 229.000');
});

test('formatGuaranies rechaza todo lo falsy que Number() convertiría en 0', () => {
  // El bug real: cada uno de estos imprimía "Gs. 0" en el email.
  for (const value of [null, undefined, '', '   ', false, [], {}]) {
    assert.equal(formatGuaranies(value), null, `${JSON.stringify(value)} debería dar null`);
  }
});

test('formatGuaranies rechaza cero, negativos y basura', () => {
  assert.equal(formatGuaranies(0), null);
  assert.equal(formatGuaranies(-229000), null);
  assert.equal(formatGuaranies('no es un monto'), null);
  assert.equal(formatGuaranies(Number.POSITIVE_INFINITY), null);
});

test('sanitizeOrderReference acepta el formato real y nada más', () => {
  assert.equal(sanitizeOrderReference('#NOCTE-1755912430118'), '#NOCTE-1755912430118');
  assert.equal(sanitizeOrderReference('  #NOCTE-1  '), '#NOCTE-1');
});

test('sanitizeOrderReference corta los tres abusos del endpoint público', () => {
  // Clave de idempotencia por encima de los 256 chars que acepta Resend.
  assert.equal(sanitizeOrderReference('N'.repeat(300)), null);
  // "[object Object]" en el asunto y una sola clave para todas las órdenes.
  assert.equal(sanitizeOrderReference({ toString: () => 'x' }), null);
  // Inyección de encabezados en el subject.
  assert.equal(sanitizeOrderReference('ok\r\nBcc: alguien@ejemplo.com'), null);
});

test('firstName arregla mayúsculas tipeadas y respeta las intencionales', () => {
  assert.equal(firstName('MATÍAS ESCOBAR GIMÉNEZ'), 'Matías');
  assert.equal(firstName('rocío benítez'), 'Rocío');
  assert.equal(firstName('  Rocío  Benítez  '), 'Rocío');
  assert.equal(firstName("O'Brien Núñez"), "O'Brien");
  assert.equal(firstName(''), '');
  assert.equal(firstName(null), '');
});

test('groupLensLines agrupa por color en el orden elegido y descarta lo desconocido', () => {
  assert.deepEqual(groupLensLines(['rojo', 'amarillo', 'rojo']), [
    { color: 'rojo', name: 'NOCTE Rojo', quantity: 2 },
    { color: 'amarillo', name: 'NOCTE Amarillo', quantity: 1 },
  ]);
  assert.deepEqual(groupLensLines(['violeta']), []);
  assert.deepEqual(groupLensLines(null), []);
});

test('normalizeEmailAddress valida forma y acota largo', () => {
  assert.equal(normalizeEmailAddress('  rocio@example.com '), 'rocio@example.com');
  assert.equal(normalizeEmailAddress('no-arroba'), null);
  assert.equal(normalizeEmailAddress(null), null);
  assert.equal(normalizeEmailAddress(`${'a'.repeat(250)}@example.com`), null);
});
