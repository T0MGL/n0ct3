/**
 * Email 01: pedido confirmado.
 *
 * Se dispara desde POST /api/send-order, y solo cuando el pedido ya quedó
 * registrado en n8n o en Ordefy. No consulta nada: el backend es stateless.
 */

const {
  emailDocument,
  gutter,
  masthead,
  accentRule,
  footer,
  displayStatement,
  sectionLabel,
  paragraph,
  closingLine,
  productImage,
  spacer,
  hairline,
  COLOR,
  FONT_DISPLAY,
  FONT_BODY,
} = require('./layout');

const {
  firstName,
  formatGuaranies,
  groupLensLines,
  escapeHtml,
  sanitizeOrderReference,
} = require('./format');

const PREHEADER = 'Preparamos tu pedido y te contactamos para coordinar la entrega.';

// Mismo nombre que la línea que sendToOrdefy carga en el pedido, para que el
// email y lo que ve el operador digan exactamente lo mismo.
const PRIORITY_SHIPPING_LABEL = 'Envío Prioritario VIP';

/**
 * Línea de pedido: concepto y cantidad a la izquierda, precio a la derecha.
 */
function orderLineRow({ name, quantity, priceText }) {
  const quantityLine = quantity
    ? `<div class="muted" style="margin:0;font-family:${FONT_BODY};font-size:13px;line-height:22px;mso-line-height-rule:exactly;color:${COLOR.inkMuted};">x ${quantity}</div>`
    : '';

  const price = priceText
    ? `<div class="ink" style="margin:0;font-family:${FONT_BODY};font-size:15px;line-height:20px;mso-line-height-rule:exactly;color:${COLOR.ink};">${priceText}</div>`
    : '&nbsp;';

  return gutter(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>` +
      `<td align="left" valign="top" style="padding:0;">` +
        `<div class="ink" style="margin:0;font-family:${FONT_BODY};font-size:13px;line-height:20px;mso-line-height-rule:exactly;letter-spacing:0.08em;text-transform:uppercase;color:${COLOR.ink};">${escapeHtml(name)}</div>` +
        `${quantityLine}` +
      `</td>` +
      `<td align="right" valign="top" style="padding:0;">${price}</td>` +
      `</tr></table>`
  );
}

function totalRow(totalText) {
  return gutter(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>` +
      `<td align="left" valign="bottom" style="padding:0;">` +
        `<div class="muted" style="margin:0;font-family:${FONT_BODY};font-size:11px;line-height:18px;mso-line-height-rule:exactly;letter-spacing:0.16em;text-transform:uppercase;color:${COLOR.inkMuted};">TOTAL</div>` +
      `</td>` +
      `<td align="right" valign="bottom" style="padding:0;">` +
        `<div class="amount ink" style="margin:0;font-family:${FONT_DISPLAY};font-size:22px;line-height:24px;mso-line-height-rule:exactly;color:${COLOR.ink};">${totalText}</div>` +
      `</td>` +
      `</tr></table>`
  );
}

function stepRow(numeral, lines) {
  return gutter(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>` +
      `<td align="left" valign="top" width="52" style="padding:0;width:52px;">` +
        `<div class="step-num muted" style="margin:0;font-family:${FONT_DISPLAY};font-size:20px;line-height:28px;mso-line-height-rule:exactly;color:${COLOR.inkMuted};">${numeral}</div>` +
      `</td>` +
      `<td align="left" valign="top" style="padding:0;">` +
        `<div class="lede ink" style="margin:0;font-family:${FONT_BODY};font-size:17px;line-height:28px;mso-line-height-rule:exactly;color:${COLOR.ink};">${lines.join('<br />')}</div>` +
      `</td>` +
      `</tr></table>`
  );
}

/**
 * Arma las líneas del pedido.
 *
 * El envío prioritario viaja sumado dentro de `total`, igual que en el pedido
 * que se carga en Ordefy. Si no se separa acá, el email le declara al cliente
 * un precio de producto que no es y contradice a la orden.
 *
 * El precio por línea solo se imprime cuando hay un único color: ahí el precio
 * del producto sale de una resta exacta (total menos envío). Con varios colores
 * el único monto disponible sigue siendo el total, y repartirlo inventaría un
 * precio unitario que NOCTE no publica. En ese caso no lleva precio ninguna
 * línea, ni siquiera la de envío: un total correcto sin desglose es aceptable,
 * un desglose a medias no.
 */
function buildContent({ customerName, lensColors, total, shippingCost, orderNumber }) {
  const greetingName = firstName(customerName);
  const lensLines = groupLensLines(lensColors);

  const totalText = formatGuaranies(total);
  const shippingText = formatGuaranies(shippingCost);
  const productText = totalText
    ? formatGuaranies(Number(total) - (shippingText ? Number(shippingCost) : 0))
    : null;

  const showLinePrices = lensLines.length === 1 && Boolean(productText);

  const lines = lensLines.map((line) => ({
    name: line.name,
    quantity: line.quantity,
    priceText: showLinePrices ? productText : null,
  }));

  if (shippingText) {
    lines.push({
      name: PRIORITY_SHIPPING_LABEL,
      quantity: null,
      priceText: showLinePrices ? shippingText : null,
    });
  }

  return {
    greeting: greetingName ? `Gracias, ${greetingName}.` : 'Gracias.',
    lines,
    totalText,
    reference: sanitizeOrderReference(orderNumber),
  };
}

function renderHtml({ greeting, lines, totalText }) {
  const rows = [
    masthead(),
    spacer(40),
    accentRule(),
    spacer(32),
    displayStatement('PEDIDO CONFIRMADO'),
    spacer(24),
    paragraph([escapeHtml(greeting)]),
    spacer(16),
    paragraph(['Tu NOCTE se está preparando', 'para la noche que te espera.']),
    spacer(48),
    productImage(),
    spacer(48),
    sectionLabel('TU PEDIDO'),
    spacer(20),
  ];

  lines.forEach((line, index) => {
    if (index > 0) rows.push(spacer(16));
    rows.push(orderLineRow(line));
  });

  if (totalText) {
    rows.push(spacer(24), hairline(), spacer(24), totalRow(totalText));
  }

  rows.push(
    spacer(48),
    sectionLabel('LO QUE SIGUE'),
    spacer(24),
    stepRow('01', ['Preparamos tu pedido.']),
    spacer(24),
    stepRow('02', ['Te contactamos para coordinar', 'la entrega.']),
    spacer(48),
    closingLine('Diseñado para tu noche.'),
    spacer(40),
    hairline(),
    spacer(24),
    footer({ withDomain: true })
  );

  return emailDocument({ title: 'Pedido confirmado', preheader: PREHEADER, rows });
}

function renderText({ greeting, lines, totalText }) {
  const blocks = [
    'NOCTE',
    'PEDIDO CONFIRMADO',
    greeting,
    'Tu NOCTE se está preparando\npara la noche que te espera.',
    'TU PEDIDO',
  ];

  for (const line of lines) {
    const parts = [line.name];
    if (line.quantity) parts.push(`x ${line.quantity}`);
    if (line.priceText) parts.push(line.priceText);
    blocks.push(parts.join('\n'));
  }

  if (totalText) blocks.push(`TOTAL\n${totalText}`);

  blocks.push(
    'LO QUE SIGUE',
    '01\nPreparamos tu pedido.',
    '02\nTe contactamos para coordinar\nla entrega.',
    'Diseñado para tu noche.',
    'NOCTE\nnocte.studio'
  );

  return `${blocks.join('\n\n')}\n`;
}

/**
 * @param {object} input
 * @param {string} input.customerName    Nombre completo del checkout.
 * @param {string[]} input.lensColors    Claves ya resueltas por resolveColors.
 * @param {number} input.total           Total cobrado, envío incluido.
 * @param {number} [input.shippingCost]  Costo del envío prioritario, 0 si no hay.
 * @param {string} [input.orderNumber]   Se sanea antes de tocar el asunto.
 */
function renderOrderConfirmedEmail({ customerName, lensColors, total, shippingCost, orderNumber }) {
  const content = buildContent({ customerName, lensColors, total, shippingCost, orderNumber });

  return {
    subject: content.reference ? `Pedido confirmado, ${content.reference}` : 'Pedido confirmado',
    reference: content.reference,
    html: renderHtml(content),
    text: renderText(content),
  };
}

module.exports = { renderOrderConfirmedEmail };
