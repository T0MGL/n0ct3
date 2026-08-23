/**
 * Email 01: pedido confirmado.
 *
 * Se dispara desde POST /api/send-order con los mismos datos que ya viajan a
 * n8n y a Ordefy. No consulta nada: el backend es stateless.
 */

const {
  COLOR,
  FONT_BODY,
  FONT_DISPLAY,
  accentRule,
  closingLine,
  displayStatement,
  emailDocument,
  footer,
  gutter,
  hairline,
  masthead,
  paragraph,
  productImage,
  sectionLabel,
  spacer,
} = require('./layout');

const { escapeHtml, firstName, formatGuaranies, groupLensLines } = require('./format');

const PREHEADER = 'Preparamos tu pedido y te contactamos para coordinar la entrega.';

/**
 * Línea de pedido: variante y cantidad a la izquierda, precio a la derecha.
 * El precio solo aparece cuando hay una sola línea, porque ahí precio de línea
 * y total son el mismo número. En un pack de varios colores se omite: el único
 * monto disponible es el total y repartirlo inventaría un precio unitario.
 */
function lensLineRow({ name, quantity, priceText }) {
  const price = priceText
    ? `<div class="ink" style="margin:0;font-family:${FONT_BODY};font-size:15px;line-height:20px;mso-line-height-rule:exactly;color:${COLOR.ink};">${priceText}</div>`
    : '&nbsp;';

  return gutter(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>` +
      `<td align="left" valign="top" style="padding:0;">` +
        `<div class="ink" style="margin:0;font-family:${FONT_BODY};font-size:13px;line-height:20px;mso-line-height-rule:exactly;letter-spacing:0.08em;text-transform:uppercase;color:${COLOR.ink};">${escapeHtml(name)}</div>` +
        `<div class="muted" style="margin:0;font-family:${FONT_BODY};font-size:13px;line-height:22px;mso-line-height-rule:exactly;color:${COLOR.inkMuted};">x ${quantity}</div>` +
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

function buildLines({ customerName, lensColors, total }) {
  const greetingName = firstName(customerName);
  const lensLines = groupLensLines(lensColors);
  const totalText = formatGuaranies(total);
  const showLinePrice = lensLines.length === 1 && Boolean(totalText);

  return {
    greeting: greetingName ? `Gracias, ${greetingName}.` : 'Gracias.',
    lensLines,
    totalText,
    showLinePrice,
  };
}

function renderHtml({ greeting, lensLines, totalText, showLinePrice }) {
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

  lensLines.forEach((line, index) => {
    if (index > 0) rows.push(spacer(16));
    rows.push(
      lensLineRow({
        name: line.name,
        quantity: line.quantity,
        priceText: showLinePrice ? totalText : null,
      })
    );
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

function renderText({ greeting, lensLines, totalText, showLinePrice }) {
  const blocks = [
    'NOCTE',
    'PEDIDO CONFIRMADO',
    greeting,
    'Tu NOCTE se está preparando\npara la noche que te espera.',
    'TU PEDIDO',
  ];

  for (const line of lensLines) {
    const parts = [line.name, `x ${line.quantity}`];
    if (showLinePrice) parts.push(totalText);
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
 * @param {string} input.customerName  Nombre completo del checkout.
 * @param {string[]} input.lensColors  Claves ya resueltas por resolveColors.
 * @param {number} input.total         Total del pedido en guaraníes.
 * @param {string} [input.orderNumber] Para el asunto, si el pedido lo trae.
 */
function renderOrderConfirmedEmail({ customerName, lensColors, total, orderNumber }) {
  const content = buildLines({ customerName, lensColors, total });
  const reference = String(orderNumber || '').trim();

  return {
    subject: reference ? `Pedido confirmado, ${reference}` : 'Pedido confirmado',
    html: renderHtml(content),
    text: renderText(content),
  };
}

module.exports = { renderOrderConfirmedEmail };
