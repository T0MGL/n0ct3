/**
 * Formateo de datos para los emails transaccionales de NOCTE.
 *
 * Todo lo que entra a un template pasa por acá: el nombre y el email vienen del
 * checkout, o sea del cliente, y nunca se interpolan crudos en el HTML.
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
 * nativo. Un monto no numérico devuelve null para que el template omita la
 * línea en vez de imprimir "Gs. NaN" o, peor, un número inventado.
 */
function formatGuaranies(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return null;
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
 * Una línea por color con su cantidad. El precio por línea NO se calcula acá:
 * solo existe el total del pedido y dividirlo inventaría un precio unitario que
 * NOCTE no publica.
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
 * Devuelve la dirección normalizada o null. Se valida forma, no existencia:
 * el único objetivo es no gastar una llamada a Resend con un string que
 * evidentemente no es un email.
 */
function normalizeEmailAddress(raw) {
  const value = String(raw == null ? '' : raw).trim();
  if (!value || value.length > 254) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return null;
  return value;
}

module.exports = {
  escapeHtml,
  formatGuaranies,
  firstName,
  groupLensLines,
  normalizeEmailAddress,
};
