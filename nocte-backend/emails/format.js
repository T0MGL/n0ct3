/**
 * Formateo y saneado de datos para los emails transaccionales de NOCTE.
 *
 * Todo lo que entra a un template pasa por acá. El nombre, el email y el número
 * de pedido vienen de /api/send-order, que es público: nada de eso se
 * interpola crudo ni en el HTML, ni en el asunto, ni en una clave de API.
 */

// Los colores llegan ya resueltos por el contrato de SKU de server.js
// (resolveColors), que garantiza claves rojo/naranja/amarillo.
const LENS_DISPLAY_NAME = {
  rojo: 'NOCTE Rojo',
  naranja: 'NOCTE Naranja',
  amarillo: 'NOCTE Amarillo',
};

const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

/**
 * Monto con el formato del sitio: separador de miles con punto, que es-PY da
 * nativo.
 *
 * Rechaza todo lo que no sea un número positivo de verdad. Number() convierte
 * null, '', [] y false en 0, así que chequear solo isFinite dejaba pasar un
 * total ausente como "Gs. 0" impreso al cliente. Devolver null obliga al
 * template a omitir la línea, que es la única salida honesta.
 */
function formatGuaranies(amount) {
  if (typeof amount !== 'number' && typeof amount !== 'string') return null;
  if (typeof amount === 'string' && amount.trim() === '') return null;

  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return null;

  return `Gs. ${Math.round(value).toLocaleString('es-PY')}`;
}

/**
 * Primer token del nombre, con la capitalización arreglada solo cuando el
 * cliente tipeó todo en mayúsculas o todo en minúsculas. Un "McKenzie" o un
 * "O'Brien" ya vienen con intención y se dejan intactos.
 */
function firstName(fullName) {
  const token = String(fullName || '').trim().split(/\s+/)[0] || '';
  if (!token) return '';

  const rest = token.slice(1);
  const hasDeliberateCasing = rest !== rest.toLowerCase() && rest !== rest.toUpperCase();
  if (hasDeliberateCasing) return token;

  return token.charAt(0).toUpperCase() + rest.toLowerCase();
}

/**
 * Agrupa los lentes por color conservando el orden en que el cliente los eligió.
 * Una línea por color con su cantidad.
 */
function groupLensLines(lensColors) {
  const list = Array.isArray(lensColors) ? lensColors : [];
  const order = [];
  const counts = new Map();

  for (const color of list) {
    const name = LENS_DISPLAY_NAME[color];
    if (!name) continue;
    if (!counts.has(color)) order.push(color);
    counts.set(color, (counts.get(color) || 0) + 1);
  }

  return order.map((color) => ({
    color,
    name: LENS_DISPLAY_NAME[color],
    quantity: counts.get(color),
  }));
}

/**
 * Devuelve la dirección normalizada o null. Se valida forma, no existencia: el
 * objetivo es no gastar una llamada a Resend con algo que evidentemente no es
 * un email.
 */
function normalizeEmailAddress(raw) {
  const value = String(raw == null ? '' : raw).trim();
  if (!value || value.length > 254) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return null;
  return value;
}

/**
 * Sanea el número de pedido antes de que toque el asunto del email, la clave
 * de idempotencia de Resend o los logs.
 *
 * /api/send-order es público, así que este valor lo elige quien llama. Sin
 * filtro, un string de 300 caracteres rompe el límite de 256 de la clave y
 * Resend devuelve 400, un objeto imprime "[object Object]" en el asunto y
 * colapsa todas las órdenes en una sola clave, y un \r\n sobrevive dentro del
 * subject. El charset es el del formato real (#NOCTE-1755912430118).
 *
 * Devuelve null si no matchea: el email igual sale, con asunto fijo y sin
 * clave derivada del input. Nunca se pierde un envío por un dato malformado.
 */
function sanitizeOrderReference(raw) {
  if (typeof raw !== 'string') return null;
  const value = raw.trim();
  return /^[A-Za-z0-9#_-]{1,64}$/.test(value) ? value : null;
}

module.exports = {
  // Presentación
  formatGuaranies,
  firstName,
  groupLensLines,
  // Saneado de entrada
  escapeHtml,
  normalizeEmailAddress,
  sanitizeOrderReference,
};
