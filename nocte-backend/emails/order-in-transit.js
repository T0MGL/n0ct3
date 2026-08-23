/**
 * Email 02: el pedido salió en camino.
 *
 * La pieza no lleva precios, ni ítems, ni total, ni link de seguimiento: en
 * este momento el trabajo del email es enseñar a usar el producto, no volver a
 * cobrar una compra ya hecha.
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
  FONT_BODY,
} = require('./layout');

const SUBJECT = 'Tu NOCTE salió en camino';
const PREHEADER = 'Cómo usar tus lentes desde la primera noche.';
const STATEMENT = 'TU NOCHE EMPIEZA HOY.';
const LEDE = 'Tu NOCTE salió en camino.';

const INSTRUCTIONS = [
  ['Ponételos 1 a 2 horas', 'antes de ir a dormir.'],
  ['Reducí la luz artificial', 'fuerte a tu alrededor.'],
  ['Mantené tu entorno oscuro', 'y tranquilo.'],
];

function instructionRow(lines) {
  return gutter(
    `<div class="lede ink" style="margin:0;font-family:${FONT_BODY};font-size:17px;line-height:28px;mso-line-height-rule:exactly;color:${COLOR.ink};">${lines.join('<br />')}</div>`
  );
}

function renderHtml() {
  const rows = [
    masthead(),
    spacer(40),
    accentRule(),
    spacer(32),
    displayStatement(STATEMENT),
    spacer(24),
    paragraph([LEDE]),
    spacer(48),
    productImage(),
    spacer(48),
    sectionLabel('CÓMO USAR TUS LENTES'),
    spacer(24),
  ];

  INSTRUCTIONS.forEach((lines, index) => {
    if (index > 0) rows.push(spacer(24));
    rows.push(instructionRow(lines));
  });

  rows.push(
    spacer(48),
    closingLine('Tu noche ahora es tuya.'),
    spacer(40),
    hairline(),
    spacer(24),
    footer({ withDomain: false })
  );

  return emailDocument({ title: SUBJECT, preheader: PREHEADER, rows });
}

function renderText() {
  const blocks = [
    'NOCTE',
    STATEMENT,
    LEDE,
    'CÓMO USAR TUS LENTES',
    ...INSTRUCTIONS.map((lines) => lines.join('\n')),
    'Tu noche ahora es tuya.',
    'NOCTE',
  ];

  return `${blocks.join('\n\n')}\n`;
}

function renderOrderInTransitEmail() {
  return {
    subject: SUBJECT,
    html: renderHtml(),
    text: renderText(),
  };
}

module.exports = { renderOrderInTransitEmail };
