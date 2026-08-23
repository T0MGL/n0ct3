/**
 * Sistema visual compartido de los emails NOCTE.
 *
 * Decisiones del medio, no de la web:
 *
 * - El sitio es negro puro. Un email todo negro se lee como UI, no como
 *   editorial, y pelea contra el modo oscuro de todos los clientes. Acá el
 *   fondo es papel cálido con tinta casi negra, y el negro de marca queda
 *   reservado a un solo bloque de cabecera a sangre.
 * - Clash Display y Satoshi no sobreviven a Gmail, que borra @font-face. Una
 *   webfont caída degrada a Arial y el email queda genérico. Por eso la voz de
 *   display es una pila serif que existe en todas las máquinas.
 * - Todo el layout va en tablas con estilos inline. El `<style>` del head solo
 *   ajusta mobile y vuelve a fijar los colores donde el cliente los invierte.
 */

const COLOR = {
  paper: '#FAF8F5',
  ink: '#141414',
  inkMuted: '#6B6560',
  hairline: '#E2DDD6',
  accent: '#E5090B',
  black: '#000000',
  imageFallback: '#1E1B19',
};

const FONT_DISPLAY = "Georgia, 'Times New Roman', Times, serif";
const FONT_BODY = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

const COLUMN_WIDTH = 600;

/**
 * El asset vive en el repo, en public/email/, y Vite lo publica en esa misma
 * ruta. Nada de depender de un archivo subido a mano que puede no estar: si no
 * existe, el catch-all del SPA devuelve index.html con 200 y el <img> termina
 * apuntando a un documento HTML.
 *
 * JPEG y no WebP porque el motor Word de Outlook no decodifica WebP. Host
 * canónico con www para que el proxy de imágenes de Gmail no coma el 307.
 */
const PRODUCT_IMAGE = {
  url: 'https://www.nocte.studio/email/nocte-lifestyle-1200x675.jpg',
  width: 1200,
  height: 675,
  alt: 'Persona con lentes NOCTE en una habitación de luz cálida y baja, al final del día.',
};

const HEAD_STYLE = `
    :root { color-scheme: light; supported-color-schemes: light; }
    body { margin: 0; padding: 0; width: 100% !important; }
    img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    table { border-collapse: collapse; }
    a { color: ${COLOR.ink}; }

    /* Gmail y Outlook.com invierten los colores por su cuenta. Volver a fijarlos
       en los dos vectores conocidos evita el peor caso, que no es un email
       oscuro sino uno a medio invertir: tinta oscura sobre fondo oscuro. */
    @media (prefers-color-scheme: dark) {
      .paper { background-color: ${COLOR.paper} !important; }
      .band { background-color: ${COLOR.black} !important; }
      .ink, .ink a { color: ${COLOR.ink} !important; }
      .muted { color: ${COLOR.inkMuted} !important; }
      .on-band { color: ${COLOR.paper} !important; }
      .hairline { background-color: ${COLOR.hairline} !important; }
      .accent { background-color: ${COLOR.accent} !important; }
    }
    [data-ogsc] .paper, [data-ogsb] .paper { background-color: ${COLOR.paper} !important; }
    [data-ogsc] .band, [data-ogsb] .band { background-color: ${COLOR.black} !important; }
    [data-ogsc] .ink { color: ${COLOR.ink} !important; }
    [data-ogsc] .muted { color: ${COLOR.inkMuted} !important; }
    [data-ogsc] .on-band { color: ${COLOR.paper} !important; }
    [data-ogsc] .hairline, [data-ogsb] .hairline { background-color: ${COLOR.hairline} !important; }
    [data-ogsc] .accent, [data-ogsb] .accent { background-color: ${COLOR.accent} !important; }

    @media only screen and (max-width: 599px) {
      .gutter { padding-left: 24px !important; padding-right: 24px !important; }
      .display { font-size: 28px !important; line-height: 1.16 !important; }
      .lede { font-size: 16px !important; }
      .step-num { font-size: 18px !important; }
      .amount { font-size: 18px !important; }
    }
`;

function gutter(inner, extraStyle = '') {
  return `<tr><td class="gutter paper" bgcolor="${COLOR.paper}" style="padding:0 40px;background-color:${COLOR.paper};${extraStyle}">${inner}</td></tr>`;
}

/** Aire vertical. En email el espaciado va en celdas, nunca en margin. */
function spacer(height) {
  return `<tr><td class="paper" bgcolor="${COLOR.paper}" height="${height}" style="height:${height}px;line-height:${height}px;font-size:${height}px;background-color:${COLOR.paper};">&nbsp;</td></tr>`;
}

/**
 * Regla de 1px. Outlook colapsa las celdas vacías, de ahí el &nbsp; achicado a
 * la altura de la propia regla.
 */
function hairline() {
  return gutter(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>` +
      `<td class="hairline" bgcolor="${COLOR.hairline}" height="1" style="height:1px;line-height:1px;font-size:1px;background-color:${COLOR.hairline};">&nbsp;</td>` +
      `</tr></table>`
  );
}

/** El único uso del rojo de marca en toda la pieza. */
function accentRule() {
  return gutter(
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>` +
      `<td class="accent" bgcolor="${COLOR.accent}" width="32" height="2" style="width:32px;height:2px;line-height:2px;font-size:2px;background-color:${COLOR.accent};">&nbsp;</td>` +
      `</tr></table>`
  );
}

function masthead() {
  return (
    `<tr><td class="band gutter" bgcolor="${COLOR.black}" align="left" style="padding:24px 40px;background-color:${COLOR.black};">` +
      `<div class="on-band" style="margin:0;font-family:${FONT_DISPLAY};font-size:15px;line-height:20px;mso-line-height-rule:exactly;letter-spacing:0.28em;text-transform:uppercase;color:${COLOR.paper};">NOCTE</div>` +
      `</td></tr>`
  );
}

/**
 * Etiqueta de sección: 11px, versalitas, tinta apagada. Va como h2 y no como
 * div porque es el encabezado real de la sección: un lector de pantalla
 * necesita poder saltar entre ellas.
 */
function sectionLabel(text) {
  return gutter(
    `<h2 class="muted" style="margin:0;font-family:${FONT_BODY};font-size:11px;line-height:16px;mso-line-height-rule:exactly;letter-spacing:0.16em;text-transform:uppercase;font-weight:400;color:${COLOR.inkMuted};">${text}</h2>`
  );
}

/** Enunciado de apertura, la voz serif de la pieza. */
function displayStatement(text) {
  return gutter(
    `<h1 class="display ink" style="margin:0;font-family:${FONT_DISPLAY};font-size:34px;line-height:1.15;mso-line-height-rule:exactly;letter-spacing:-0.01em;font-weight:400;color:${COLOR.ink};">${text}</h1>`
  );
}

/** Párrafo de cuerpo. `lines` se une con <br>: los cortes son parte de la copy. */
function paragraph(lines, { color = COLOR.ink, size = 17 } = {}) {
  const klass = color === COLOR.inkMuted ? 'muted' : 'ink';
  return gutter(
    `<p class="lede ${klass}" style="margin:0;font-family:${FONT_BODY};font-size:${size}px;line-height:1.65;mso-line-height-rule:exactly;color:${color};">${lines.join('<br />')}</p>`
  );
}

/** Cierre editorial en serif, antes del pie. */
function closingLine(text) {
  return gutter(
    `<p class="ink" style="margin:0;font-family:${FONT_DISPLAY};font-size:20px;line-height:1.4;mso-line-height-rule:exactly;color:${COLOR.ink};">${text}</p>`
  );
}

/**
 * Imagen a sangre de la columna, sin padding: cualquier relleno acá se ve como
 * franjas oscuras arriba y abajo de la foto.
 *
 * La celda lleva color sólido y el alt hereda tipografía clara, así que cuando
 * el cliente bloquea imágenes el bloque sigue estando, en color de marca y con
 * texto legible, en vez de dejar un hueco blanco. El atributo height reserva la
 * altura en los clientes que lo respetan (Outlook, Gmail).
 */
function productImage() {
  const displayHeight = Math.round((COLUMN_WIDTH * PRODUCT_IMAGE.height) / PRODUCT_IMAGE.width);
  return (
    `<tr><td bgcolor="${COLOR.imageFallback}" align="center" style="padding:0;background-color:${COLOR.imageFallback};font-size:0;line-height:0;">` +
      `<img src="${PRODUCT_IMAGE.url}" width="${COLUMN_WIDTH}" height="${displayHeight}" alt="${PRODUCT_IMAGE.alt}" ` +
      `style="display:block;width:100%;max-width:${COLUMN_WIDTH}px;height:auto;border:0;font-family:${FONT_BODY};font-size:13px;line-height:20px;color:${COLOR.paper};" />` +
      `</td></tr>`
  );
}

/** Pie: wordmark chico y, opcional, el dominio. */
function footer({ withDomain }) {
  const wordmark =
    `<div class="muted" style="margin:0;font-family:${FONT_DISPLAY};font-size:12px;line-height:18px;mso-line-height-rule:exactly;letter-spacing:0.28em;text-transform:uppercase;color:${COLOR.inkMuted};">NOCTE</div>`;

  if (!withDomain) return gutter(wordmark);

  return gutter(
    `${wordmark}<div style="height:6px;line-height:6px;font-size:6px;">&nbsp;</div>` +
      `<div style="margin:0;font-family:${FONT_BODY};font-size:12px;line-height:18px;mso-line-height-rule:exactly;color:${COLOR.inkMuted};">` +
      `<a href="https://nocte.studio" class="muted" style="color:${COLOR.inkMuted};text-decoration:none;">nocte.studio</a></div>`
  );
}

/**
 * Texto de vista previa. Va oculto y se rellena con caracteres invisibles para
 * que la bandeja no arrastre el primer párrafo del cuerpo detrás de él.
 */
function preheaderBlock(text) {
  const filler = '&#847;&zwnj;&nbsp;'.repeat(60);
  return (
    `<div style="display:none;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${COLOR.paper};">` +
      `${text}${filler}</div>`
  );
}

/**
 * Documento completo. `rows` son las filas de la columna de 600px, ya armadas
 * con los helpers de arriba.
 */
function emailDocument({ title, preheader, rows }) {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="es">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${title}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style type="text/css">${HEAD_STYLE}  </style>
</head>
<body class="paper" bgcolor="${COLOR.paper}" style="margin:0;padding:0;background-color:${COLOR.paper};">
${preheaderBlock(preheader)}
<table role="presentation" class="paper" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${COLOR.paper}" style="background-color:${COLOR.paper};">
  <tr>
    <td align="center" style="padding:0 0 40px 0;">
      <!--[if mso]><table role="presentation" width="${COLUMN_WIDTH}" cellpadding="0" cellspacing="0" border="0" align="center" style="width:${COLUMN_WIDTH}px;"><tr><td><![endif]-->
      <table role="presentation" class="paper" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${COLOR.paper}" style="width:100%;max-width:${COLUMN_WIDTH}px;background-color:${COLOR.paper};">
${rows.join('\n')}
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td>
  </tr>
</table>
</body>
</html>`;
}

module.exports = {
  // Tokens
  COLOR,
  FONT_DISPLAY,
  FONT_BODY,
  PRODUCT_IMAGE,
  // Documento
  emailDocument,
  gutter,
  // Bloques de marca
  masthead,
  accentRule,
  footer,
  // Bloques de contenido
  displayStatement,
  sectionLabel,
  paragraph,
  closingLine,
  productImage,
  // Separación
  spacer,
  hairline,
};
