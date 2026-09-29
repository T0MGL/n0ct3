import { useEffect, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { NocteMark } from "@/components/NocteMark";
import { WhatsAppGlyph } from "@/components/WhatsAppGlyph";
import { SuccessPage } from "@/components/checkout/SuccessPage";
import { submitPaidOrder, successOrderData } from "@/components/checkout/paidOrder";
import { settlePaymentReturn, type PaymentReturnOutcome } from "@/components/checkout/paymentReturn";
import { discardPendingPayment, markPendingPaymentSent, readPendingPayment } from "@/lib/pending-payment";
import { API_CONFIG, getStripe } from "@/lib/stripe";
import { buildWhatsAppUrl } from "@/lib/contact";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const PAGE_TITLE = "Tu pago | NOCTE ®";

const retrievePaymentIntent = async (clientSecret: string) => {
  const stripe = await getStripe();
  if (!stripe) return undefined;
  const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);
  return paymentIntent;
};

const REPORTED_KEY = "nocte_payment_reported";

// Deja rastro en el backend de un cobro que este navegador no puede convertir
// en pedido. El backend verifica el pago contra Stripe antes de alertar, asi
// que no sirve para inventar alertas. Una vez por pago y pestaña: recargar no
// le duplica la alerta a quien la carga a mano.
const reportPaidWithoutOrder = (paymentIntentId: string, clientSecret: string): void => {
  try {
    if (window.sessionStorage.getItem(REPORTED_KEY) === paymentIntentId) return;
    window.sessionStorage.setItem(REPORTED_KEY, paymentIntentId);
  } catch {
    // Sin sessionStorage se avisa igual: una alerta de mas es mejor que ninguna.
  }
  void fetch(`${API_CONFIG.baseUrl}/api/payment-without-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paymentIntentId, clientSecret }),
    keepalive: true,
  }).catch(() => undefined);
};

// Una sola curva para la entrada de cada estado: es el unico movimiento de la
// pagina y marca que el estado cambio.
const ENTER = { duration: 0.32, ease: [0.16, 1, 0.3, 1] as const };

interface StatusViewProps {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  actions: ReactNode;
}

const StatusView = ({ icon, title, children, actions }: StatusViewProps) => {
  const reduceMotion = useReducedMotion();
  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={ENTER}
      aria-live="polite"
      className="w-full max-w-md"
    >
      <div className="mb-5 text-variant-active [&_svg]:h-10 [&_svg]:w-10" aria-hidden="true">
        {icon}
      </div>
      <h1 className="text-balance text-2xl font-bold leading-tight text-foreground md:text-3xl">{title}</h1>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-muted-foreground">{children}</div>
      <div className="mt-8 flex flex-col gap-3">{actions}</div>
    </motion.section>
  );
};

const WhatsAppAction = ({ message, primary = false }: { message: string; primary?: boolean }) => (
  <Button asChild variant={primary ? "hero" : "outline"} size={primary ? "xl" : "lg"} className="w-full">
    <a href={buildWhatsAppUrl(message)} target="_blank" rel="noopener noreferrer">
      <WhatsAppGlyph className="h-5 w-5" />
      Escribir por WhatsApp
    </a>
  </Button>
);

const Checking = () => {
  const reduceMotion = useReducedMotion();
  return (
    <section aria-live="polite" aria-busy="true" className="w-full max-w-md">
      <h1 className="text-2xl font-bold leading-tight text-foreground md:text-3xl">Confirmando tu pago</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
        Estamos consultando el estado con el banco. No cierres esta página.
      </p>
      {/* Barra indeterminada y no un spinner: dice que algo avanza sin
          prometer cuanto falta. Con movimiento reducido queda quieta. */}
      <div className="mt-8 h-0.5 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full w-1/3 rounded-full bg-variant-active"
          initial={false}
          animate={reduceMotion ? { x: "100%" } : { x: ["-100%", "300%"] }}
          transition={reduceMotion ? { duration: 0 } : { duration: 1.1, ease: "easeInOut", repeat: Infinity }}
        />
      </div>
    </section>
  );
};

/**
 * /payment-success. Stripe devuelve aca al cliente cuando el pago con tarjeta
 * tuvo que salir de la pagina para autorizarse. Con la tarjeta resuelta en la
 * misma pagina nunca se llega: ese pedido lo manda el checkout.
 */
export const PaymentReturn = () => {
  const { search } = useLocation();
  const navigate = useNavigate();
  const [outcome, setOutcome] = useState<PaymentReturnOutcome | null>(null);

  useEffect(() => {
    document.title = PAGE_TITLE;
  }, []);

  useEffect(() => {
    let cancelled = false;
    void settlePaymentReturn({
      search,
      readPending: () => readPendingPayment(),
      markSent: (paymentIntentId, orderNumber) => markPendingPaymentSent(paymentIntentId, orderNumber),
      discard: (paymentIntentId) => discardPendingPayment(paymentIntentId),
      retrieve: retrievePaymentIntent,
      submit: submitPaidOrder,
      reportPaidWithoutOrder,
    })
      .catch((): PaymentReturnOutcome => ({ kind: "unverified" }))
      .then((result) => {
        if (!cancelled) setOutcome(result);
      });
    return () => {
      cancelled = true;
    };
  }, [search]);

  const goHome = () => navigate("/", { replace: true });
  const reload = () => window.location.reload();

  if (outcome?.kind === "paid") {
    const { order } = outcome.paid;
    return (
      <main className="min-h-[100dvh] bg-background">
        <SuccessPage isOpen orderData={successOrderData(order, order.lines)} onClose={goHome} />
      </main>
    );
  }

  return (
    <main className="flex min-h-[100dvh] flex-col bg-background px-4 pb-12 pt-8 md:px-8">
      <a
        href="/"
        className="self-start text-foreground/80 transition-opacity hover:opacity-70"
        aria-label="NOCTE, volver a la tienda"
      >
        <NocteMark title={null} className="h-4 w-auto" />
      </a>
      <div className="flex flex-1 items-center justify-center py-12">
        {outcome === null && <Checking />}

        {outcome?.kind === "already-sent" && (
          <StatusView
            icon={<CheckCircleIcon />}
            title="Tu pedido ya está registrado"
            actions={
              <>
                <Button variant="hero" size="xl" className="w-full" onClick={goHome}>
                  Volver a la tienda
                </Button>
                <WhatsAppAction message={`Hola! Quiero consultar por mi pedido ${outcome.orderNumber}.`} />
              </>
            }
          >
            <p>
              Orden <span className="font-semibold text-foreground">{outcome.orderNumber}</span>. Te escribimos por
              WhatsApp para coordinar la entrega.
            </p>
          </StatusView>
        )}

        {outcome?.kind === "paid-without-order" && (
          <StatusView
            icon={<CheckCircleIcon />}
            title="Recibimos tu pago"
            actions={
              <>
                <WhatsAppAction
                  primary
                  message={`Hola! Pagué con tarjeta y quiero confirmar mi pedido. Referencia de pago: ${outcome.paymentIntentId}`}
                />
                <Button variant="outline" size="lg" className="w-full" onClick={goHome}>
                  Volver a la tienda
                </Button>
              </>
            }
          >
            <p>
              Tu pago quedó confirmado, pero no pudimos recuperar los datos de entrega en este navegador. No vuelvas a
              pagar.
            </p>
            <p>Te contactamos para coordinar la entrega. Si preferís, escribinos ahora.</p>
          </StatusView>
        )}

        {outcome?.kind === "processing" && (
          <StatusView
            icon={<ClockIcon />}
            title="Tu pago se está procesando"
            actions={
              <>
                <Button variant="hero" size="xl" className="w-full" onClick={reload}>
                  Actualizar estado
                </Button>
                <WhatsAppAction message="Hola! Pagué con tarjeta y el pago figura en proceso. Me ayudan a confirmarlo?" />
              </>
            }
          >
            <p>El banco todavía no lo confirmó. No vuelvas a pagar.</p>
            <p>En unos minutos actualizá el estado para registrar tu pedido, o escribinos y lo vemos juntos.</p>
          </StatusView>
        )}

        {outcome?.kind === "failed" && (
          <StatusView
            icon={<ExclamationTriangleIcon />}
            title="El pago no se completó"
            actions={
              <>
                <Button
                  variant="hero"
                  size="xl"
                  className="w-full"
                  onClick={() => navigate(outcome.retryPath, { replace: true })}
                >
                  Intentar de nuevo
                </Button>
                <WhatsAppAction message="Hola! Quise pagar con tarjeta y el pago no se completó. Me ayudan con el pedido?" />
              </>
            }
          >
            <p>No se hizo ningún cobro. Podés intentar de nuevo o pedir por WhatsApp y pagar al recibir.</p>
          </StatusView>
        )}

        {outcome?.kind === "unverified" && (
          <StatusView
            icon={<ExclamationTriangleIcon />}
            title="No pudimos confirmar tu pago"
            actions={
              <>
                <Button variant="hero" size="xl" className="w-full" onClick={reload}>
                  Revisar de nuevo
                </Button>
                <WhatsAppAction message="Hola! Pagué con tarjeta y no pude ver si el pago se confirmó. Me ayudan a revisarlo?" />
              </>
            }
          >
            <p>
              Si ya autorizaste el pago en tu banco, no lo repitas. Revisá de nuevo en un momento o escribinos y lo
              verificamos.
            </p>
          </StatusView>
        )}

        {outcome?.kind === "invalid" && (
          <StatusView
            icon={<ExclamationTriangleIcon />}
            title="No hay ningún pago para mostrar"
            actions={
              <Button variant="hero" size="xl" className="w-full" onClick={goHome}>
                Ir a la tienda
              </Button>
            }
          >
            <p>Esta página se abre sola al volver del banco después de pagar con tarjeta.</p>
          </StatusView>
        )}
      </div>
    </main>
  );
};

export default PaymentReturn;
