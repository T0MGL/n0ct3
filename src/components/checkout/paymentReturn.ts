import type { PaymentIntent } from "@stripe/stripe-js";
import type { PaidOrder } from "@/components/checkout/paidOrder";
import type { PendingPayment } from "@/lib/pending-payment";

/**
 * Que paso con un pago que volvio de un redirect de Stripe. La pagina de
 * retorno solo pinta esto; toda la decision vive aca para poder probarla sin
 * navegador.
 */
export type PaymentReturnOutcome =
  /** Pago confirmado y pedido enviado ahora, desde el pedido guardado antes de pagar. */
  | { kind: "paid"; paid: PaidOrder }
  /** El pedido ya salio en una carga anterior de esta pagina. */
  | { kind: "already-sent"; orderNumber: string }
  /** Cobrado, pero este navegador no tiene el pedido. Se avisa al backend, no se inventa. */
  | { kind: "paid-without-order"; paymentIntentId: string }
  | { kind: "processing" }
  | { kind: "failed"; retryPath: string }
  /** No se pudo consultar a Stripe. El pago puede estar hecho: no invitar a pagar de nuevo. */
  | { kind: "unverified" }
  /** Sin parametros de Stripe en la URL: alguien entro a /payment-success a mano. */
  | { kind: "invalid" };

export interface PaymentReturnDeps {
  search: string;
  readPending: () => PendingPayment | undefined;
  markSent: (paymentIntentId: string, orderNumber: string) => boolean;
  discard: (paymentIntentId: string) => void;
  /** stripe.retrievePaymentIntent con el client secret de la URL. */
  retrieve: (clientSecret: string) => Promise<Pick<PaymentIntent, "id" | "status"> | undefined>;
  submit: (paid: PaidOrder) => void;
  reportPaidWithoutOrder: (paymentIntentId: string, clientSecret: string) => void;
}

const readReturnParams = (search: string): { paymentIntentId: string; clientSecret: string } | undefined => {
  const params = new URLSearchParams(search);
  const paymentIntentId = params.get("payment_intent");
  const clientSecret = params.get("payment_intent_client_secret");
  if (!paymentIntentId || !/^pi_[A-Za-z0-9]+$/.test(paymentIntentId)) return undefined;
  // El secret de Stripe es "<id>_secret_<...>": uno que no empieza con el id
  // de la URL es de otro pago o esta armado a mano.
  if (!clientSecret || !clientSecret.startsWith(`${paymentIntentId}_secret_`)) return undefined;
  return { paymentIntentId, clientSecret };
};

async function resolvePaymentReturn(deps: PaymentReturnDeps): Promise<PaymentReturnOutcome> {
  const params = readReturnParams(deps.search);
  if (!params) return { kind: "invalid" };
  const { paymentIntentId, clientSecret } = params;

  const stored = deps.readPending();
  const pending = stored?.paymentIntentId === paymentIntentId ? stored : undefined;

  // Recarga despues de mandar el pedido: no se consulta nada ni se manda nada.
  if (pending?.status === "sent") return { kind: "already-sent", orderNumber: pending.orderNumber };

  // redirect_status de la URL no se usa para decidir: la URL la puede escribir
  // cualquiera. El estado real sale de Stripe.
  let intent: Pick<PaymentIntent, "id" | "status"> | undefined;
  try {
    intent = await deps.retrieve(clientSecret);
  } catch {
    intent = undefined;
  }
  if (!intent || intent.id !== paymentIntentId) return { kind: "unverified" };

  if (intent.status === "processing") return { kind: "processing" };

  if (intent.status !== "succeeded") {
    // El pedido guardado de un pago que no se cobro no le sirve a nadie. Con
    // processing se conserva: el cliente puede volver cuando se acredite.
    if (pending) deps.discard(paymentIntentId);
    return { kind: "failed", retryPath: pending?.status === "pending" ? pending.checkoutPath : "/" };
  }

  if (pending?.status === "pending" && deps.markSent(paymentIntentId, pending.paid.order.orderNumber)) {
    deps.submit(pending.paid);
    return { kind: "paid", paid: pending.paid };
  }

  deps.reportPaidWithoutOrder(paymentIntentId, clientSecret);
  return { kind: "paid-without-order", paymentIntentId };
}

// Un solo intento por pago y por carga de pagina. React puede montar la pagina
// dos veces (StrictMode, un remount del router) y las dos tienen que ver el
// mismo resultado sin que el segundo montaje vuelva a mandar el pedido. Solo
// guarda el ultimo pago: no crece.
let lastSettle: { key: string; outcome: Promise<PaymentReturnOutcome> } | undefined;

export function settlePaymentReturn(deps: PaymentReturnDeps): Promise<PaymentReturnOutcome> {
  if (lastSettle?.key === deps.search) return lastSettle.outcome;
  const outcome = resolvePaymentReturn(deps);
  lastSettle = { key: deps.search, outcome };
  return outcome;
}

/** Solo para tests: olvida el intento en memoria, como una recarga de la pagina. */
export function resetPaymentReturnForTests(): void {
  lastSettle = undefined;
}
