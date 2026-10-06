/**
 * Rastro de los cobros con tarjeta para conciliar contra Ordefy.
 *
 * El pedido de un pago con tarjeta lo manda el navegador (/api/send-order),
 * nunca el webhook de Stripe. El webhook no puede armarlo bien: el
 * PaymentIntent no trae las lineas con upsells y colores, ni el RUC, ni el GPS,
 * ni la atribucion. Si ademas lo mandara, n8n no deduplica y el cliente
 * recibiria dos confirmaciones de WhatsApp por un solo pago. Lo que si puede
 * hacer el backend es dejar una linea buscable por cobro:
 *
 *   stripe.payment_succeeded  cada cobro confirmado (webhook). Se cruza contra
 *                             Ordefy por orderNumber.
 *   PAGO_SIN_PEDIDO           un cobro confirmado que el navegador del cliente
 *                             no pudo convertir en pedido, o cuyo envio no
 *                             confirmo. Buscar el orderNumber en Ordefy antes
 *                             de cargarlo a mano: el pedido pudo llegar igual.
 *
 * Ninguna de las dos lleva datos del cliente: el orderNumber alcanza para
 * encontrarlo en Stripe.
 */

const PAYMENT_INTENT_ID = /^pi_[A-Za-z0-9]+$/;

const describe = (paymentIntent) => {
  const orderNumber = paymentIntent.metadata?.orderNumber || 'sin-orden';
  const currency = String(paymentIntent.currency || '').toUpperCase();
  return `pi=${paymentIntent.id} orderNumber=${orderNumber} amount=${paymentIntent.amount} ${currency}`;
};

const succeededPaymentLog = (paymentIntent) => `stripe.payment_succeeded ${describe(paymentIntent)}`;

const paymentWithoutOrderAlert = (paymentIntent) =>
  `🚨 PAGO_SIN_PEDIDO ${describe(paymentIntent)}. Cobrado y el navegador no confirmo el pedido: verificar en Ordefy por orderNumber antes de cargarlo.`;

/**
 * Valida el aviso de /payment-success antes de alertar. Mismo criterio que
 * /api/update-payment-intent: el pi_ circula por Ordefy, n8n y los logs, el
 * client secret no, asi que es la prueba de que el aviso viene del comprador.
 * Y el cobro tiene que estar confirmado en Stripe: sin eso no hay alerta.
 */
async function verifyPaymentWithoutOrder(body, retrievePaymentIntent) {
  const { paymentIntentId, clientSecret } = body || {};
  if (typeof paymentIntentId !== 'string' || !PAYMENT_INTENT_ID.test(paymentIntentId)) {
    return { status: 400 };
  }
  if (typeof clientSecret !== 'string' || clientSecret.length === 0) {
    return { status: 400 };
  }

  let paymentIntent;
  try {
    paymentIntent = await retrievePaymentIntent(paymentIntentId);
  } catch (error) {
    if (error?.code === 'resource_missing') return { status: 404 };
    // Stripe caido o sin credenciales: el aviso puede ser real y es el unico
    // que va a llegar, asi que se deja la marca aunque no se haya verificado.
    return { status: 502, alert: `🚨 PAGO_SIN_PEDIDO_NO_VERIFICADO pi=${paymentIntentId}. Revisar el cobro en Stripe.` };
  }
  if (paymentIntent.client_secret !== clientSecret) return { status: 403 };
  if (paymentIntent.status !== 'succeeded') return { status: 409 };

  return { status: 202, alert: paymentWithoutOrderAlert(paymentIntent) };
}

module.exports = { succeededPaymentLog, paymentWithoutOrderAlert, verifyPaymentWithoutOrder };
