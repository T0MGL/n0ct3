/**
 * Email 02: el pedido salió en camino.
 *
 * Dos aperturas para que Gaston elija. De la imagen para abajo son idénticas.
 * La pieza no lleva precios, ni ítems, ni total, ni link de seguimiento: en
 * este momento el trabajo del email es enseñar a usar el producto, no volver a
 * cobrar una compra ya hecha.
 */

const {
  COLOR,
  FONT_BODY,
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

const PREHEADER = 'Cómo usar tus lentes desde la primera noche.';

const OPENINGS = {
  b: {
    statement: 'TU NOCHE EMPIEZA HOY.',
    lede: 'Tu NOCTE salió en camino.',
    subject: 'Tu NOCTE salió en camino',
  },
  a: {
    statement: 'TU NOCHE EMPIEZA AHORA.',
    lede: 'Tu NOCTE llegó.',
    subject: 'Tu NOCTE llegó',
  },
};

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

function renderHtml(opening) {
  const rows = [
    masthead(),
    spacer(40),
    accentRule(),
    spacer(32),
    displayStatement(opening.statement),
    spacer(24),
    paragraph([opening.lede]),
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

  return emailDocument({ title: opening.subject, preheader: PREHEADER, rows });
}

function renderText(opening) {
  const blocks = [
    'NOCTE',
    opening.statement,
    opening.lede,
    'CÓMO USAR TUS LENTES',
    ...INSTRUCTIONS.map((lines) => lines.join('\n')),
    'Tu noche ahora es tuya.',
    'NOCTE',
  ];

  return `${blocks.join('\n\n')}\n`;
}

/**
 * @param {object} [input]
 * @param {'a'|'b'} [input.variant] Apertura. Por defecto la recomendada (B).
 */
function renderOrderInTransitEmail({ variant = 'b' } = {}) {
  const opening = OPENINGS[variant] || OPENINGS.b;

  return {
    subject: opening.subject,
    html: renderHtml(opening),
    text: renderText(opening),
  };
}

module.exports = { renderOrderInTransitEmail };
