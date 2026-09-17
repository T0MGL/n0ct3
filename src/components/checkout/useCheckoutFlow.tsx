import { lazy, Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { sendOrderInBackground, generateOrderNumber, notifyCheckoutStarted } from "@/services/orderService";
import {
  trackInitiateCheckout,
  trackAddToCart,
  trackPurchase,
  trackServerPurchase,
  type MetaUserData,
} from "@/lib/meta-pixel";
import { getFbc, getFbp, hashEmail, hashExternalId, hashPhoneE164, hashFirstName, hashLastName, hashCity, hashCountry, hashDepartment } from "@/lib/meta-matching";
import { ALL_VARIANTS_SOLD_OUT } from "@/lib/variants";
import { ALL_MASK_COLORS_SOLD_OUT } from "@/lib/mask-colors";
import {
  buildOrderLines,
  describeOrderLines,
  legacyOrderFields,
  metaNumItems,
  summarizeOrder,
  metaContent,
  sumLines,
  type CheckoutItem,
  type OrderLine,
} from "@/lib/order";
import { preloadMaskPhoto } from "@/lib/mask-photos";
import { useExitIntent } from "@/hooks/useExitIntent";
import type { PaymentResult } from "@/components/checkout/StripeCheckoutModal";

// How long the Purchase pixel waits for /api/send-order to hand back the
// server event id before falling back to the legacy pixel.
const PURCHASE_ID_WAIT_MS = 6000;

const PhoneNameForm = lazy(() => import("@/components/checkout/PhoneNameForm"));
const SuccessPage = lazy(() => import("@/components/checkout/SuccessPage"));
const StripeCheckoutModal = lazy(() => import("@/components/checkout/StripeCheckoutModal"));
const ExitIntentModal = lazy(() => import("@/components/checkout/ExitIntentModal"));

interface CheckoutFlowOptions {
  /** Item de relleno mientras no hay checkout abierto. startBuyFlow pone el real. */
  initialItem: () => CheckoutItem;
  /** Como se nombra el item en el aviso de carrito abandonado a n8n. */
  checkoutLabel: (item: CheckoutItem) => string;
  /** Lo que se estaba por comprar, para el mensaje de WhatsApp del modal de salida. */
  exitIntentProduct?: string;
}

/**
 * El camino de compra entero: formulario de contacto, pago, exito, salida por
 * WhatsApp, y el pedido y el Purchase que salen al confirmar. Vivia pegado a
 * Index.tsx; /sleep-mask vende por el mismo camino, asi que un arreglo del
 * checkout o del pixel llega a las dos paginas y no hay dos Purchase distintos.
 *
 * Cada pagina conserva lo suyo: que se compra, cuando dispara su AddToCart y
 * como se nombra en el aviso de carrito abandonado.
 */
export function useCheckoutFlow({ initialItem, checkoutLabel, exitIntentProduct }: CheckoutFlowOptions) {
  const [showStripeCheckout, setShowStripeCheckout] = useState(false);
  const [showPhoneForm, setShowPhoneForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [checkoutInProgress, setCheckoutInProgress] = useState(false);
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [exitIntentShown, setExitIntentShown] = useState(false);

  const [checkoutData, setCheckoutData] = useState(() => ({
    /** Que se esta comprando. Se congela al abrir el checkout. */
    item: initialItem(),
    /** El pedido cerrado, con upsells. Existe recien cuando el pago se confirma. */
    lines: null as OrderLine[] | null,
    location: "",
    name: "",
    phone: "",
    address: "",
    isGeolocated: false,
    lat: undefined as number | undefined,
    long: undefined as number | undefined,
    orderNumber: "",
    paymentIntentId: "",
    ruc: "" as string | undefined,
    email: undefined as string | undefined,
  }));

  // Detect exit intent during Stripe checkout only, show WhatsApp downsell
  const isInCheckout = showStripeCheckout;
  useExitIntent({
    onExitIntent: () => {
      if (isInCheckout && !showSuccess && !exitIntentShown && !showExitIntent) {
        setShowStripeCheckout(false);
        setShowExitIntent(true);
        setExitIntentShown(true);
      }
    },
    enabled: isInCheckout && !showSuccess && !exitIntentShown && !showExitIntent,
  });

  // Prevent page close/reload during checkout
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (checkoutInProgress && !showSuccess) {
        e.preventDefault();
        e.returnValue = "Tenés un pedido en proceso. Si salís ahora, perdés tu progreso.";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [checkoutInProgress, showSuccess]);

  // Generate order number on component mount
  useEffect(() => {
    if (!checkoutData.orderNumber) {
      setCheckoutData((prev) => ({
        ...prev,
        orderNumber: generateOrderNumber(),
      }));
    }
  }, [checkoutData.orderNumber]);

  // Track InitiateCheckout when phone form opens
  const checkoutItem = checkoutData.item;
  useEffect(() => {
    if (!showPhoneForm) return;
    trackInitiateCheckout({
      ...metaContent(checkoutItem),
      num_items: checkoutItem.quantity,
      value: checkoutItem.amount,
      currency: 'PYG',
    });
  }, [showPhoneForm, checkoutItem]);

  /**
   * Abre el checkout para un producto cualquiera. Los lentes llegan con su
   * pack y sus colores, el clip-on y el antifaz llegan solos. Un unico camino
   * de compra: si cada producto tuviera el suyo, cada arreglo del checkout
   * habria que hacerlo varias veces.
   */
  const startBuyFlow = useCallback((item: CheckoutItem, trackAtc: boolean) => {
    // Los colores agotados solo bloquean la venta de su producto. El clip-on
    // no depende del stock de ningun color.
    if (item.product === "lentes" && ALL_VARIANTS_SOLD_OUT) return;
    if (item.product === "sleepmask" && ALL_MASK_COLORS_SOLD_OUT) return;

    setCheckoutInProgress(true);
    setCheckoutData((prev) => ({ ...prev, item, lines: null }));

    if (trackAtc) {
      trackAddToCart({
        ...metaContent(item),
        num_items: item.quantity,
        value: item.amount,
        currency: 'PYG',
      });
    }

    setShowPhoneForm(true);
    // La foto del antifaz se pide recien aca, al abrir el checkout: la landing
    // no la carga, y cuando el cliente llega al resumen ya esta en cache. En el
    // checkout del antifaz ese bump no existe.
    if (item.product !== "sleepmask") preloadMaskPhoto();

    import("@/components/checkout/StripeCheckoutModal");
    import("@/components/checkout/ExitIntentModal");
  }, []);

  const handlePaymentSuccess = useCallback((result: PaymentResult) => {
    // INSTANT transition - no waiting for API calls
    setCheckoutData((prev) => {
      // Prefer the email that came back from the payment modal (card typed
      // it in-form, COD may have it from the factura path) and fall back to
      // whatever was already stored on checkoutData from PhoneNameForm.
      const effectiveEmail = result.email || prev.email;
      const { quantity, colors } = legacyOrderFields(prev.item, result.lines);

      // Send the order to the backend. The success screen never waits on
      // this, only the Purchase pixel does: with META_SERVER_PURCHASE on, the
      // server emits the Purchase itself and answers with its event_id.
      const orderSent = sendOrderInBackground({
        name: prev.name,
        phone: prev.phone,
        location: prev.location,
        address: prev.address,
        lat: prev.lat,
        long: prev.long,
        ruc: prev.ruc,
        lines: result.lines,
        quantity,
        total: result.finalTotal,
        orderNumber: prev.orderNumber,
        paymentIntentId: result.paymentIntentId,
        email: effectiveEmail,
        paymentType: result.paymentType,
        isPaid: result.isPaid,
        deliveryType: result.deliveryType,
        colors,
        fbp: getFbp(),
        fbc: getFbc(),
      });

      // El value del Purchase es el total real cobrado, upsells incluidos, no
      // el precio del producto: sale de la suma de las lineas del pedido.
      const purchaseParams = {
        value: result.finalTotal,
        currency: 'PYG',
        ...metaContent(prev.item),
        num_items: metaNumItems(prev.item, result.lines),
        order_id: prev.orderNumber,
      };

      // Hash the Advanced Matching payload off the main thread while the
      // order is in flight, then fire Purchase once the backend answers. If
      // the server already emitted it, the pixel replays under the same
      // event_id and Meta dedupes. Otherwise (flag off, Meta down, request
      // lost) today's pixel plus CAPI mirror fires exactly as before. If
      // hashing fails the event still goes out without user_data so we never
      // lose a conversion signal.
      void (async () => {
        let userData: MetaUserData | undefined;
        try {
          const [em, ph, external_id, fn, ln, ct, country, st] = await Promise.all([
            hashEmail(effectiveEmail),
            hashPhoneE164(prev.phone),
            hashExternalId(prev.orderNumber),
            hashFirstName(prev.name),
            hashLastName(prev.name),
            hashCity(prev.location),
            hashCountry(),
            hashDepartment(prev.location),
          ]);
          userData = { em, ph, fn, ln, ct, country, st, external_id, fbc: getFbc(), fbp: getFbp() };
        } catch (err) {
          if (import.meta.env.DEV) {
            console.error('[Meta] hash failed, firing without user_data', err);
          }
        }

        // Bounded wait: on a slow backend the legacy pixel fires anyway so a
        // buyer closing the tab never costs the conversion. With the flag on
        // and a backend slower than this, Meta may see two ids for one order
        // (server ORD-based, browser #NOC-based); rarer and cheaper than
        // losing the event.
        const { purchaseEventId } = await Promise.race([
          orderSent,
          new Promise<{ purchaseEventId?: undefined }>((resolve) => {
            setTimeout(() => resolve({}), PURCHASE_ID_WAIT_MS);
          }),
        ]);
        if (purchaseEventId) {
          trackServerPurchase(purchaseParams, userData, purchaseEventId);
        } else {
          trackPurchase(purchaseParams, userData, prev.orderNumber);
        }
      })();

      return { ...prev, paymentIntentId: result.paymentIntentId, lines: result.lines, email: effectiveEmail };
    });

    // INSTANT UI update - show success immediately
    setShowStripeCheckout(false);
    setShowSuccess(true);
  }, []);

  const handleBackToPhoneForm = useCallback(() => {
    setShowStripeCheckout(false);
    setShowPhoneForm(true);
  }, []);

  const resetCheckoutData = useCallback(() => ({
    item: initialItem(),
    lines: null as OrderLine[] | null,
    location: "",
    name: "",
    phone: "",
    address: "",
    isGeolocated: false,
    orderNumber: generateOrderNumber(),
    paymentIntentId: "",
    lat: undefined as number | undefined,
    long: undefined as number | undefined,
    ruc: undefined as string | undefined,
    email: undefined as string | undefined,
  }), [initialItem]);

  const handleStripeCheckoutClose = useCallback(() => {
    if (!exitIntentShown) {
      setShowStripeCheckout(false);
      setShowExitIntent(true);
      setExitIntentShown(true);
    } else {
      setShowStripeCheckout(false);
      setCheckoutInProgress(false);
      setCheckoutData(resetCheckoutData());
    }
  }, [resetCheckoutData, exitIntentShown]);

  const handlePhoneSubmit = useCallback((data: { name: string; phone: string; location: string; address: string; isGeolocated: boolean; lat?: number; long?: number; ruc?: string; email?: string }) => {
    // Store personal info and location, then proceed to payment
    setCheckoutData((prev) => ({
      ...prev,
      name: data.name,
      phone: data.phone,
      location: data.location,
      address: data.address,
      isGeolocated: data.isGeolocated,
      lat: data.lat,
      long: data.long,
      ruc: data.ruc,
      email: data.email,
    }));

    // El recupero de carrito abandonado describe lo que el cliente iba a
    // comprar, asi que sale del item congelado y no de lo que muestre la
    // landing: quien entro por el clip-on nunca eligio un pack.
    notifyCheckoutStarted({
      name: data.name,
      phone: data.phone,
      location: data.location,
      address: data.address,
      lat: data.lat,
      long: data.long,
      bundleLabel: checkoutLabel(checkoutItem),
      quantity: checkoutItem.quantity,
      price: checkoutItem.amount,
      colors: checkoutItem.product === "lentes" ? checkoutItem.colors : undefined,
    });

    setShowPhoneForm(false);
    setShowStripeCheckout(true); // Show payment with all info collected
  }, [checkoutItem, checkoutLabel]);

  const handlePhoneFormClose = useCallback(() => {
    if (!exitIntentShown) {
      // First time closing → show WhatsApp downsell instead of closing
      setShowPhoneForm(false);
      setShowExitIntent(true);
      setExitIntentShown(true);
    } else {
      // Already shown WhatsApp modal → just close
      setShowPhoneForm(false);
      setCheckoutInProgress(false);
      setCheckoutData(resetCheckoutData());
    }
  }, [resetCheckoutData, exitIntentShown]);

  const handleSuccessClose = useCallback(() => {
    setShowSuccess(false);
    setCheckoutInProgress(false); // Deactivate protection
    setCheckoutData(resetCheckoutData());
  }, [resetCheckoutData]);

  const orderData = useMemo(() => {
    // Generate Google Maps link if we have coordinates
    let googleMapsLink: string | undefined;
    if (checkoutData.lat && checkoutData.long) {
      googleMapsLink = `https://www.google.com/maps?q=${checkoutData.lat},${checkoutData.long}`;
    }

    // El pedido cerrado incluye los upsells, asi que el resumen y el mensaje
    // de WhatsApp salen de las lineas: un antifaz que no figura aca es un
    // antifaz que el cliente no sabe que compro hasta que le llega. Antes de
    // confirmar el pago todavia no hay lineas y vale el item solo.
    const lines: OrderLine[] =
      checkoutData.lines ?? buildOrderLines(checkoutData.item, { sleepMaskPicks: [], priorityShipping: false });

    return {
      orderNumber: checkoutData.orderNumber,
      products: describeOrderLines(lines),
      summary: summarizeOrder(lines),
      total: `${sumLines(lines).toLocaleString('es-PY')} Gs`,
      location: checkoutData.location,
      phone: checkoutData.phone,
      name: checkoutData.name,
      address: checkoutData.address,
      googleMapsLink,
    };
  }, [checkoutData]);

  // Memoize customerData to prevent re-renders of StripeCheckoutModal (contains expensive Stripe Elements)
  const customerData = useMemo(() => ({
    name: checkoutData.name,
    phone: checkoutData.phone,
    location: checkoutData.location,
    address: checkoutData.address,
    isGeolocated: checkoutData.isGeolocated,
    orderNumber: checkoutData.orderNumber,
    email: checkoutData.email,
  }), [checkoutData.name, checkoutData.phone, checkoutData.location, checkoutData.address, checkoutData.isGeolocated, checkoutData.orderNumber, checkoutData.email]);

  const modals: ReactNode = (
    <>
      {showPhoneForm && (
        <Suspense fallback={null}>
          <PhoneNameForm
            isOpen={showPhoneForm}
            onSubmit={handlePhoneSubmit}
            onClose={handlePhoneFormClose}
          />
        </Suspense>
      )}

      {showStripeCheckout && (
        <Suspense fallback={null}>
          <StripeCheckoutModal
            isOpen={showStripeCheckout}
            onClose={handleStripeCheckoutClose}
            onBack={handleBackToPhoneForm}
            onSuccess={handlePaymentSuccess}
            item={checkoutItem}
            currency="pyg"
            isProcessingOrder={false}
            customerData={customerData}
          />
        </Suspense>
      )}

      {showSuccess && (
        <Suspense fallback={null}>
          <SuccessPage
            isOpen={showSuccess}
            orderData={orderData}
            onClose={handleSuccessClose}
          />
        </Suspense>
      )}

      {showExitIntent && (
        <Suspense fallback={null}>
          <ExitIntentModal
            isOpen={showExitIntent}
            product={exitIntentProduct}
            onClose={() => {
              setShowExitIntent(false);
              setCheckoutInProgress(false);
            }}
          />
        </Suspense>
      )}
    </>
  );

  return { startBuyFlow, modals };
}
