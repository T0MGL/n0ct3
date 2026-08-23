/**
 * Renderiza los emails transaccionales a nocte-backend/previews/ con datos de
 * ejemplo realistas. No manda nada ni necesita RESEND_API_KEY.
 *
 *   npm run preview:emails
 */

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const { renderOrderConfirmedEmail, renderOrderInTransitEmail } = require('../emails');
const { PRODUCT_IMAGE } = require('../emails/layout');

const OUTPUT_DIR = path.resolve(__dirname, '..', 'previews');

// El mismo JPEG 1200x675 que va publicado en producción, leído del repo para
// que la preview no dependa de un deploy y muestre exactamente la composición
// que se envía. Sustituir por otro asset acá haría que lo aprobado no sea lo
// que sale: el WebP del sitio es casi cuadrado y daría un bloque de otra altura.
const LOCAL_IMAGE = path.resolve(__dirname, '..', '..', 'public', 'email', 'nocte-lifestyle-1200x675.jpg');

function withLocalImage(html) {
  return html.split(PRODUCT_IMAGE.url).join(pathToFileURL(LOCAL_IMAGE).href);
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
        shippingCost: 0,
        orderNumber: '#NOCTE-1755912430118',
      }),
  },
  {
    // Un solo color con envío prioritario: el envío tiene que aparecer como
    // línea propia y el lente conservar su precio real, no el inflado.
    file: 'order-confirmed-envio',
    render: () =>
      renderOrderConfirmedEmail({
        customerName: 'Rocío Benítez Villalba',
        lensColors: ['rojo'],
        total: 239000,
        shippingCost: 10000,
        orderNumber: '#NOCTE-1755913004291',
      }),
  },
  {
    // Pack mixto: sin precio por línea, solo TOTAL.
    file: 'order-confirmed-pack',
    render: () =>
      renderOrderConfirmedEmail({
        customerName: 'MATÍAS ESCOBAR GIMÉNEZ',
        lensColors: ['rojo', 'amarillo', 'naranja'],
        total: 489000,
        shippingCost: 0,
        orderNumber: '#NOCTE-1755914882057',
      }),
  },
  {
    file: 'in-transit',
    render: () => renderOrderInTransitEmail(),
  },
];

function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  if (!fs.existsSync(LOCAL_IMAGE)) {
    console.error(`Falta el asset de la foto: ${LOCAL_IMAGE}`);
    process.exit(1);
  }

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
