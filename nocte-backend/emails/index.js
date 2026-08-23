/**
 * Emails transaccionales de NOCTE. Punto de entrada para server.js.
 */

const { renderOrderConfirmedEmail } = require('./order-confirmed');
const { renderOrderInTransitEmail } = require('./order-in-transit');
const { normalizeEmailAddress } = require('./format');
const { deliver } = require('./deliver');

// El pedido responde primero y el email va en paralelo, así que su timeout
// tiene que ser más corto que la paciencia del checkout. El de tránsito no
// bloquea a ningún cliente esperando en una pantalla: puede esperar más.
const CONFIRMATION_TIMEOUT_MS = 3000;
const IN_TRANSIT_TIMEOUT_MS = 8000;

/**
 * Confirmación de pedido. Se invoca dentro del Promise.allSettled de
 * /api/send-order, nunca después de responder: en Vercel la lambda se puede
 * congelar apenas sale la respuesta y el envío quedaría a medias.
 */
async function sendOrderConfirmedEmail({ to, customerName, lensColors, total, shippingCost, orderNumber }) {
  const recipient = normalizeEmailAddress(to);
  if (!recipient) return { skipped: true, reason: 'no_email' };

  const email = renderOrderConfirmedEmail({
    customerName,
    lensColors,
    total,
    shippingCost,
    orderNumber,
  });

  return deliver({
    to: recipient,
    subject: email.subject,
    html: email.html,
    text: email.text,
    // El checkout puede reintentar el POST si la red se corta después de que el
    // servidor ya lo procesó. Con el número de pedido como clave, ese reintento
    // no le manda dos confirmaciones al cliente.
    //
    // Solo con la referencia ya saneada: /api/send-order es público y un
    // orderNumber crudo puede pasarse de los 256 caracteres que acepta Resend,
    // o colapsar todas las órdenes en una única clave. Sin referencia válida se
    // manda sin clave, que es peor que idempotente pero mejor que no enviar.
    idempotencyKey: email.reference ? `nocte-order-confirmed-${email.reference}` : undefined,
    timeoutMs: CONFIRMATION_TIMEOUT_MS,
  });
}

/**
 * Aviso de salida a reparto.
 *
 * Idempotencia en dos capas, sin almacenamiento nuevo:
 *
 *  1. La clave de Resend. Un duplicado con la misma clave devuelve la misma
 *     respuesta sin volver a enviar. La ventana de retención es de 24 horas,
 *     que cubre 4 de los 5 duplicados medidos en producción (9,5h y 14,6h x3).
 *  2. El quinto llegó a las 81,7 horas, fuera de esa ventana. Ese caso no se
 *     puede atajar sin estado, y este backend no tiene ninguno a propósito:
 *     el emisor (Ordefy) es el dueño de disparar una sola vez por pedido. Un
 *     Set en memoria acá sería una garantía falsa, porque cada lambda de Vercel
 *     corre con su propia memoria.
 */
async function sendOrderInTransitEmail({ to, orderId }) {
  const recipient = normalizeEmailAddress(to);
  if (!recipient) return { skipped: true, reason: 'no_email' };

  const email = renderOrderInTransitEmail();

  return deliver({
    to: recipient,
    subject: email.subject,
    html: email.html,
    text: email.text,
    idempotencyKey: `nocte-in-transit-${orderId}`,
    timeoutMs: IN_TRANSIT_TIMEOUT_MS,
  });
}

module.exports = {
  // Envío, para server.js
  sendOrderConfirmedEmail,
  sendOrderInTransitEmail,
  // Render puro, para scripts/preview-emails.js
  renderOrderConfirmedEmail,
  renderOrderInTransitEmail,
};
