/**
 * Renderiza los emails transaccionales a nocte-backend/previews/ con datos de
 * ejemplo realistas. No manda nada ni necesita RESEND_API_KEY.
 *
 *   node scripts/preview-emails.js
 */

const fs = require('fs');
const path = require('path');

const {
  renderOrderConfirmedEmail,
  renderOrderInTransitEmail,
} = require('../emails');
const { PRODUCT_IMAGE } = require('../emails/layout');

const OUTPUT_DIR = path.resolve(__dirname, '..', 'previews');

// La foto de producción todavía no está publicada, y tiene que ser un JPEG
// porque el motor Word de Outlook no decodifica WebP. Para que la preview
// muestre la composición en vez de un bloque vacío se apunta al asset del
// sitio. Es una sustitución solo de preview: el template manda la URL absoluta.
const LOCAL_IMAGE = path.resolve(__dirname, '..', '..', 'public', 'nocte-lifestyle.webp');

function withLocalImage(html) {
  return html.split(PRODUCT_IMAGE.url).join(`file://${LOCAL_IMAGE}`);
}

// Nombres tipeados como llegan del checkout real: uno con mayúscula inicial y
// otro todo en mayúsculas, para ver que el saludo salga bien en los dos casos.
const FIXTURES = [
  {
    file: 'order-confirmed',
    render: () =>
      renderOrderConfirmedEmail({
        customerName: 'Rocío Benítez Villalba',
        lensColors: ['rojo'],
        total: 229000,
        orderNumber: '#NOCTE-1755912430118',
      }),
  },
  {
    file: 'order-confirmed-pack',
    render: () =>
      renderOrderConfirmedEmail({
        customerName: 'MATÍAS ESCOBAR GIMÉNEZ',
        lensColors: ['rojo', 'amarillo', 'naranja'],
        total: 489000,
        orderNumber: '#NOCTE-1755914882057',
      }),
  },
  {
    file: 'in-transit-variant-b',
    render: () => renderOrderInTransitEmail({ variant: 'b' }),
  },
  {
    file: 'in-transit-variant-a',
    render: () => renderOrderInTransitEmail({ variant: 'a' }),
  },
];

function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const written = [];

  for (const fixture of FIXTURES) {
    const email = fixture.render();
    const htmlPath = path.join(OUTPUT_DIR, `${fixture.file}.html`);
    const textPath = path.join(OUTPUT_DIR, `${fixture.file}.txt`);

    fs.writeFileSync(htmlPath, withLocalImage(email.html), 'utf8');
    fs.writeFileSync(textPath, `Asunto: ${email.subject}\n\n${email.text}`, 'utf8');

    written.push(htmlPath, textPath);
  }

  console.log(`Previews en ${OUTPUT_DIR}\n`);
  for (const file of written) console.log(file);
}

main();
