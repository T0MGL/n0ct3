/**
 * Transporte de los emails transaccionales. Único punto que habla con Resend.
 */

const { Resend } = require('resend');

// Remitente por defecto. El dominio tiene que estar verificado en Resend o la
// API rechaza el envío, por eso queda sobreescribible por entorno.
const DEFAULT_FROM = 'NOCTE <pedidos@nocte.studio>';

let client = null;

function getClient() {
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

function isConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

/**
 * Envía un email y devuelve el resultado. Nunca lanza: el llamador decide qué
 * hacer con un fallo, y en ningún flujo el fallo de un email puede romper el
 * pedido.
 *
 * `timeoutMs` acota la latencia que el llamador percibe, no aborta el request
 * en vuelo. Es aceptable porque el resultado no bloquea a nadie y porque la
 * clave de idempotencia hace que un reintento posterior no duplique el envío.
 */
async function deliver({ to, subject, html, text, idempotencyKey, timeoutMs = 3000 }) {
  if (!isConfigured()) {
    console.warn('⚠️ Resend not configured (RESEND_API_KEY missing), email skipped');
    return { skipped: true, reason: 'RESEND_API_KEY not configured' };
  }

  let timer;
  const deadline = new Promise((resolve) => {
    timer = setTimeout(() => resolve({ timedOut: true }), timeoutMs);
  });

  const request = getClient()
    .emails.send(
      {
        from: process.env.RESEND_FROM || DEFAULT_FROM,
        to: [to],
        subject,
        html,
        text,
      },
      idempotencyKey ? { idempotencyKey } : undefined
    )
    .then((response) => ({ response }))
    .catch((error) => ({ thrown: error }));

  try {
    const outcome = await Promise.race([request, deadline]);

    if (outcome.timedOut) {
      // No es un fallo de entrega: el request sigue en vuelo y lo más probable
      // es que el email salga, solo que más lento que la ventana que se le dio.
      // Queda como desconocido para que nadie lea el log como "no se envió".
      console.warn(`⚠️ Resend unresolved after ${timeoutMs}ms, request still in flight (${idempotencyKey || subject})`);
      return { success: false, unresolved: true, error: 'timeout_unresolved' };
    }

    if (outcome.thrown) {
      // Solo el mensaje: el error de la SDK arrastra el request completo, con
      // la dirección del cliente y la API key en los headers.
      console.error('❌ Resend request failed:', outcome.thrown.message);
      return { success: false, error: outcome.thrown.message };
    }

    const { data, error } = outcome.response;
    if (error) {
      console.error('❌ Resend API error:', error.name || 'unknown', error.message || '');
      return { success: false, error: error.message || 'Resend API error' };
    }

    console.log(`✅ Email sent (${idempotencyKey || subject}): ${data && data.id}`);
    return { success: true, id: data && data.id };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { deliver };
