import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { generateOrderNumber, notifyCheckoutStarted } from "@/services/orderService";
import { trackInitiateCheckout, trackAddToCart } from "@/lib/meta-pixel";
import { ALL_VARIANTS_SOLD_OUT } from "@/lib/variants";
import { ALL_MASK_COLORS_SOLD_OUT } from "@/lib/mask-colors";
import { buildOrderLines, metaContent, type CheckoutItem, type OrderLine } from "@/lib/order";
import { preloadMaskPhoto } from "@/lib/mask-photos";
import { useExitIntent } from "@/hooks/useExitIntent";
import { discardPendingPayment, savePendingPayment } from "@/lib/pending-payment";
import { buildPaidOrder, submitPaidOrder, successOrderData } from "@/components/checkout/paidOrder";
import type { PaymentResult } from "@/components/checkout/StripeCheckoutModal";

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

  // Mientras Stripe confirma un pago la pagina puede irse al banco a proposito.
  // Sin esto el aviso de salida frena el redirect y el cliente queda con el
  // pago a medio autorizar.
  const leavingForPaymentRef = useRef(false);

  // Prevent page close/reload during checkout
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (checkoutInProgress && !showSuccess && !leavingForPaymentRef.current) {
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
      const paid = buildPaidOrder(prev, result);
      submitPaidOrder(paid);
      return { ...prev, paymentIntentId: result.paymentIntentId, lines: result.lines, email: paid.order.email };
    });

    // INSTANT UI update - show success immediately
    setShowStripeCheckout(false);
    setShowSuccess(true);
  }, []);

  /**
   * Corre justo antes de confirmPayment. Si el metodo de pago redirige, esta
   * pagina se descarga y el pedido lo manda /payment-success desde lo que se
   * guarda aca, que es exactamente lo que handlePaymentSuccess habria mandado.
   * Devuelve que hacer cuando la confirmacion vuelve a esta pagina: el aviso de
   * salida se rearma siempre, el pedido guardado se tira solo si se pide.
   */
  const preparePaymentRedirect = useCallback((result: PaymentResult) => {
    // Corre antes de cobrar: nada de lo que pase aca puede frenar el pago. Si
    // falla se pierde solo la red del retorno.
    try {
      savePendingPayment(result.paymentIntentId, buildPaidOrder(checkoutData, result), window.location.pathname);
    } catch {
      // savePendingPayment no tira; buildPaidOrder lee cookies y storage.
    }
    leavingForPaymentRef.current = true;
    return (discardPending: boolean) => {
      leavingForPaymentRef.current = false;
      if (discardPending) discardPendingPayment(result.paymentIntentId);
    };
  }, [checkoutData]);

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

  // El pedido cerrado incluye los upsells, asi que el resumen y el mensaje de
  // WhatsApp salen de las lineas: un antifaz que no figura aca es un antifaz
  // que el cliente no sabe que compro hasta que le llega. Antes de confirmar el
  // pago todavia no hay lineas y vale el item solo.
  const orderData = useMemo(
    () =>
      successOrderData(
        checkoutData,
        checkoutData.lines ?? buildOrderLines(checkoutData.item, { sleepMaskPicks: [], priorityShipping: false }),
      ),
    [checkoutData],
  );

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
            preparePaymentRedirect={preparePaymentRedirect}
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
