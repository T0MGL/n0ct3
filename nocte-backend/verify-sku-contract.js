/**
 * SKU contract verification harness.
 *
 * Safe by default: prints the exact Ordefy payload the backend would build for
 * the canonical cases and asserts each against the definitive contract.
 * It does NOT POST anything. Requiring server.js here does not open the port
 * (server.js only listens when run directly).
 *
 *   node verify-sku-contract.js            -> prints + asserts the payloads
 *   node verify-sku-contract.js --run-e2e  -> blocked unless explicitly gated
 *
 * The --run-e2e path is a scaffold only. It refuses to run without
 * NOCTE_E2E_CONFIRM=YES_RUN_REAL_ORDER in the environment, because a real POST
 * creates a real order and decrements real stock.
 */

const {
  resolveTier,
  buildProductLineItem,
  UNITS_PER_PACK,
} = require('./server');

// Mirror of the envelope built in sendToOrdefy, with the variable parts a test
// can control. Kept in lockstep with server.js by reusing buildProductLineItem
// for the only color-sensitive part. The envelope fields match v2 exactly:
// customer, shipping_address, items, totals.total, payment_method.
function buildOrdefyPayload({ quantity, colors, total, isPriority = false, orderNumber }) {
  const priorityCost = isPriority ? 10000 : 0;
  const productPrice = total - priorityCost;
  const tier = resolveTier(quantity);
  const items = [buildProductLineItem(tier, colors, productPrice)];

  if (isPriority) {
    items.push({
      sku: 'NOCTE-ENVIO-PRIORITARIO',
      name: 'Envío Prioritario VIP',
      quantity: 1,
      price: priorityCost,
    });
  }

  return {
    idempotency_key: orderNumber,
    customer: { name: 'Test Cliente', phone: '0991234567', email: 'test@nocte.studio' },
    shipping_address: { address: 'Av Test 123', city: 'Asunción', reference: 'casa' },
    items,
    totals: { subtotal: total, shipping: 0, total },
    payment_method: 'cash_on_delivery',
    payment_status: 'pending',
  };
}

function assertContract(label, payload, expectMixed) {
  const line = payload.items[0];
  const failures = [];

  if (line.sku === 'NOCTE-GLASSES-PERSONAL' || /-PERSONAL$/.test(line.sku)) {
    failures.push(`parent SKU leaked: ${line.sku} (would trigger AMBIGUOUS_PARENT_SKU)`);
  }
  if (typeof payload.totals.total !== 'number') {
    failures.push('totals.total is not a number (idempotency key would fail with 500)');
  }
  if (expectMixed && !line.bundle_selections) {
    failures.push('expected bundle_selections on a mixed pack, none present');
  }
  if (expectMixed === false && line.bundle_selections) {
    failures.push('mono-color line must NOT carry bundle_selections');
  }
  if (line.bundle_selections) {
    const unitsPerPack = line.sku.includes('OFICINA') ? UNITS_PER_PACK.oficina : UNITS_PER_PACK.pareja;
    const sum = line.bundle_selections.reduce((acc, s) => acc + s.quantity, 0);
    const expected = line.quantity * unitsPerPack;
    if (sum !== expected) {
      failures.push(`bundle_selections sum ${sum} != packs*units_per_pack ${expected}`);
    }
    line.bundle_selections.forEach((s) => {
      if (!/^NOCTE-GLASSES-(ROJO|NARANJA|AMARILLO)$/.test(s.sku)) {
        failures.push(`bundle_selection sku not an individual lens: ${s.sku}`);
      }
    });
  }

  console.log(`\n===== ${label} =====`);
  console.log(JSON.stringify(payload, null, 2));
  if (failures.length) {
    console.log(`  ❌ FAIL: ${failures.join(' | ')}`);
  } else {
    console.log('  ✅ matches contract');
  }
  return failures.length === 0;
}

function runPayloadChecks() {
  const results = [];

  results.push(assertContract(
    'Caso 1: 1 lente suelto Naranja (229000)',
    buildOrdefyPayload({ quantity: 1, colors: ['naranja'], total: 229000, orderNumber: 'VERIFY-SUELTO-NARANJA' }),
    false,
  ));

  results.push(assertContract(
    'Caso 2: Pack Pareja mono Amarillo (349000)',
    buildOrdefyPayload({ quantity: 2, colors: ['amarillo', 'amarillo'], total: 349000, orderNumber: 'VERIFY-PAREJA-AMARILLO' }),
    false,
  ));

  results.push(assertContract(
    'Caso 3: Pack Oficina mono Rojo (489000)',
    buildOrdefyPayload({ quantity: 3, colors: ['rojo', 'rojo', 'rojo'], total: 489000, orderNumber: 'VERIFY-OFICINA-ROJO' }),
    false,
  ));

  results.push(assertContract(
    'Caso 4: Pack Oficina mixto Rojo + Naranja + Amarillo (489000)',
    buildOrdefyPayload({ quantity: 3, colors: ['rojo', 'naranja', 'amarillo'], total: 489000, orderNumber: 'VERIFY-OFICINA-MIXTO' }),
    true,
  ));

  // Edge: Pareja mixto Rojo + Naranja, bundle_selections must sum to 2.
  results.push(assertContract(
    'Edge: Pack Pareja mixto Rojo + Naranja (349000)',
    buildOrdefyPayload({ quantity: 2, colors: ['rojo', 'naranja'], total: 349000, orderNumber: 'VERIFY-PAREJA-MIXTO' }),
    true,
  ));

  // Edge: colors absent. Must default to rojo with no regression and no crash.
  // Suelto with no colors -> single Rojo lens, no bundle_selections.
  results.push(assertContract(
    'Edge: Suelto sin colors (defaultea Rojo)',
    buildOrdefyPayload({ quantity: 1, colors: undefined, total: 229000, orderNumber: 'VERIFY-SUELTO-DEFAULT' }),
    false,
  ));

  const passed = results.filter(Boolean).length;
  console.log(`\n${passed}/${results.length} cases match the contract.`);
  process.exit(passed === results.length ? 0 : 1);
}

/**
 * E2E scaffold. GATED. Does nothing real unless explicitly confirmed.
 *
 * Intended flow once Gaston gives the go:
 *   1. Read current per-color stock from Ordefy (Rojo/Naranja/Amarillo).
 *   2. POST one mixed Pack Oficina order to the webhook.
 *   3. Advance it to ready_to_ship.
 *   4. Assert each color decremented by exactly 1.
 *   5. Cancel the order, assert each color restored by exactly 1.
 *   6. Clean up so prod stock ends exactly where it started.
 */
function runE2E() {
  if (process.env.NOCTE_E2E_CONFIRM !== 'YES_RUN_REAL_ORDER') {
    console.log('E2E is gated. A real POST creates a real order and decrements real stock.');
    console.log('To run after Gaston approves: NOCTE_E2E_CONFIRM=YES_RUN_REAL_ORDER node verify-sku-contract.js --run-e2e');
    process.exit(0);
  }
  throw new Error('E2E execution body intentionally not implemented until Gaston approves the live run.');
}

if (process.argv.includes('--run-e2e')) {
  runE2E();
} else {
  runPayloadChecks();
}
