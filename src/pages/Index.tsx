import { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { DeliveryBanner } from "@/components/DeliveryBanner";
import { NocteMark } from "@/components/NocteMark";
import { AuthorityBadge } from "@/components/AuthorityBadge";
import { HeroSection } from "@/components/HeroSection";
import { StickyBuyButton } from "@/components/StickyBuyButton";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { OfferCTA } from "@/components/OfferCTA";
import { sendOrderInBackground, generateOrderNumber, notifyCheckoutStarted } from "@/services/orderService";
import {
  trackInitiateCheckout,
  trackAddToCart,
  trackPurchase,
  trackServerPurchase,
  type MetaUserData,
} from "@/lib/meta-pixel";
import { getFbc, getFbp, hashEmail, hashExternalId, hashPhoneE164, hashFirstName, hashLastName, hashCity, hashCountry } from "@/lib/meta-matching";
import { BUNDLES, DEFAULT_BUNDLE_INDEX } from "@/lib/bundles";
import { ALL_VARIANTS_SOLD_OUT, DEFAULT_VARIANT, resizePicks, resolveSelectableVariant, type VariantId } from "@/lib/variants";
import {
  CLIP_ON,
  clipOnItem,
  describeOrderLines,
  metaContent,
  sumLines,
  type CheckoutItem,
  type OrderLine,
} from "@/lib/order";
import { preloadMaskPhoto } from "@/lib/mask-photos";
import { useExitIntent } from "@/hooks/useExitIntent";
import { getStripe } from "@/lib/stripe";

// How long the Purchase pixel waits for /api/send-order to hand back the
// server event id before falling back to the legacy pixel.
const PURCHASE_ID_WAIT_MS = 6000;

// Preload Stripe.js immediately so it's ready when the user clicks buy
getStripe();

// Lazy load heavy sections that are below the fold
const ProblemSection = lazy(() => import("@/components/ProblemSection"));
const MomentsSection = lazy(() => import("@/components/MomentsSection"));
const CelebritiesMarquee = lazy(() => import("@/components/CelebritiesMarquee"));
const ProductVideo = lazy(() => import("@/components/ProductVideo"));
const BlueLightMorph = lazy(() => import("@/components/BlueLightMorph"));
const UnboxingSection = lazy(() => import("@/components/UnboxingSection"));
const BenefitsSection = lazy(() => import("@/components/BenefitsSection"));
const LifestyleSection = lazy(() => import("@/components/LifestyleSection"));
const ComparisonTable = lazy(() => import("@/components/ComparisonTable"));
const TestimonialsSection = lazy(() => import("@/components/TestimonialsSection"));
const FAQSection = lazy(() => import("@/components/FAQSection"));
const GuaranteeSection = lazy(() => import("@/components/GuaranteeSection"));
const ClipOnSection = lazy(() => import("@/components/ClipOnSection"));

// Lazy load checkout modals (only loaded when user clicks buy)
const PhoneNameForm = lazy(() => import("@/components/checkout/PhoneNameForm"));
const SuccessPage = lazy(() => import("@/components/checkout/SuccessPage"));
const StripeCheckoutModal = lazy(() => import("@/components/checkout/StripeCheckoutModal"));
const ExitIntentModal = lazy(() => import("@/components/checkout/ExitIntentModal"));

// Preload checkout chunks during idle time so the first buy click is instant.
// The hero CTA itself lives in the main bundle (HeroSection is a synchronous
// import), so the button renders as soon as React mounts. This prewarms the
// modal bundles in the background without blocking initial paint.
const preloadCheckoutChunks = () => {
  void import("@/components/checkout/PhoneNameForm");
  void import("@/components/checkout/StripeCheckoutModal");
};

if (typeof window !== "undefined") {
  const schedule = (cb: () => void) => {
    const ric = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
    if (typeof ric === "function") {
      ric(cb);
    } else {
      setTimeout(cb, 1500);
    }
  };
  schedule(preloadCheckoutChunks);
}


const defaultBundle = BUNDLES[DEFAULT_BUNDLE_INDEX];

/**
 * Congela el pack elegido como linea de pedido. Los colores se resuelven aca y
 * no despues: resolveSelectableVariant es la ultima compuerta, un color
 * agotado que se colo por un estado viejo o un deep link no puede llegar al
 * pedido. Una vez armado el item, reabrir el picker ya no lo cambia.
 */
const lensItem = (bundleIndex: number, picks: readonly VariantId[]): CheckoutItem => {
  const bundle = BUNDLES[bundleIndex];
  return {
    product: "lentes",
    quantity: bundle.quantity,
    amount: bundle.price,
    colors: Array.from({ length: bundle.quantity }, (_, i) =>
      resolveSelectableVariant(picks[i] ?? picks[0] ?? DEFAULT_VARIANT),
    ),
  };
};

const Index = () => {
  // Bundle selection state (visible on landing page)
  const [selectedBundleIndex, setSelectedBundleIndex] = useState(DEFAULT_BUNDLE_INDEX);
  // Tracks whether trackAddToCart has already fired for the current session so
  // we never emit ATC twice (on pack switch + on comprar ahora). The Meta
  // funnel needs ATC before IC, so if the user accepts the default pack
  // without touching the selector, ATC fires on the buy click as a fallback.
  const [atcFired, setAtcFired] = useState(false);

  const selectedBundle = BUNDLES[selectedBundleIndex];
  const selectedPrice = selectedBundle.price;
  const selectedQuantity = selectedBundle.quantity;

  // Checkout state management
  const [showStripeCheckout, setShowStripeCheckout] = useState(false);
  const [showPhoneForm, setShowPhoneForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [checkoutInProgress, setCheckoutInProgress] = useState(false);
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [exitIntentShown, setExitIntentShown] = useState(false);

  // Per-unit color picks. Length stays in sync with selectedQuantity (see effect below).
  const [picks, setPicks] = useState<VariantId[]>(() =>
    Array.from({ length: defaultBundle.quantity }, () => DEFAULT_VARIANT),
  );

  const [checkoutData, setCheckoutData] = useState({
    /** Que se esta comprando. Se congela al abrir el checkout. */
    item: lensItem(DEFAULT_BUNDLE_INDEX, [DEFAULT_VARIANT]) as CheckoutItem,
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
  });

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

  // Mantiene picks del largo de selectedQuantity. Al agrandar conserva lo ya
  // elegido y completa con los colores que faltan (ver resizePicks): pasar al
  // pack de tres deja el color elegido en la unidad 1 y suma los otros dos, en
  // vez de tres veces el mismo lente. Con algun color agotado vuelve a repetir
  // el primero, porque el set completo no se puede armar.
  useEffect(() => {
    setPicks((prev) => (prev.length === selectedQuantity ? prev : resizePicks(prev, selectedQuantity)));
  }, [selectedQuantity]);

  const handlePickChange = useCallback((unitIndex: number, next: VariantId) => {
    setPicks((prev) => {
      if (prev[unitIndex] === next) return prev;
      const copy = prev.slice();
      copy[unitIndex] = next;
      return copy;
    });
  }, []);


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

  const handleBundleSelect = useCallback((index: number) => {
    // Only emit AddToCart when the user actually switches to a different pack.
    // Re-clicking the already-selected pack is a no-op so we never flood Meta
    // with redundant events, and Personal (the default) never fires ATC from
    // here because it is pre-selected.
    if (index !== selectedBundleIndex) {
      const item = lensItem(index, picks);
      trackAddToCart({
        ...metaContent(item),
        num_items: item.quantity,
        value: item.amount,
        currency: 'PYG',
      });
      setAtcFired(true);
    }
    setSelectedBundleIndex(index);
  }, [selectedBundleIndex, picks]);

  /**
   * Abre el checkout para un producto cualquiera. Los lentes llegan con su
   * pack y sus colores, el clip-on llega solo. Un unico camino de compra: si
   * el clip-on tuviera el suyo, cada arreglo del checkout habria que hacerlo
   * dos veces.
   */
  const startBuyFlow = useCallback((item: CheckoutItem, trackAtc: boolean) => {
    // Los colores agotados solo bloquean la venta de lentes. El clip-on no
    // depende del stock de los tres tonos.
    if (item.product === "lentes" && ALL_VARIANTS_SOLD_OUT) return;

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
    // no la carga, y cuando el cliente llega al resumen ya esta en cache.
    preloadMaskPhoto();

    import("@/components/checkout/StripeCheckoutModal");
    import("@/components/checkout/ExitIntentModal");
  }, []);

  const handleBuyClick = useCallback(() => {
    startBuyFlow(lensItem(selectedBundleIndex, picks), !atcFired);
    setAtcFired(true);
  }, [startBuyFlow, selectedBundleIndex, picks, atcFired]);

  // El clip-on emite siempre su propio AddToCart y no toca atcFired: es otro
  // producto, el ATC de los lentes no lo cubre y este no cubre al de ellos.
  const handleClipOnBuyClick = useCallback(() => {
    startBuyFlow(clipOnItem(), true);
  }, [startBuyFlow]);

  const handlePaymentSuccess = useCallback((result: {
    paymentIntentId: string;
    paymentType: 'Card' | 'COD';
    isPaid: boolean;
    deliveryType: 'común' | 'premium';
    lines: OrderLine[];
    finalTotal: number;
    email?: string;
  }) => {
    // INSTANT transition - no waiting for API calls
    setCheckoutData((prev) => {
      // Prefer the email that came back from the payment modal (card typed
      // it in-form, COD may have it from the factura path) and fall back to
      // whatever was already stored on checkoutData from PhoneNameForm.
      const effectiveEmail = result.email || prev.email;

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
        quantity: prev.item.quantity,
        total: result.finalTotal,
        orderNumber: prev.orderNumber,
        paymentIntentId: result.paymentIntentId,
        email: effectiveEmail,
        paymentType: result.paymentType,
        isPaid: result.isPaid,
        deliveryType: result.deliveryType,
        colors: prev.item.product === 'lentes' ? prev.item.colors : undefined,
        fbp: getFbp(),
        fbc: getFbc(),
      });

      // El value del Purchase es el total real cobrado, upsells incluidos, no
      // el precio del producto: sale de la suma de las lineas del pedido.
      const purchaseParams = {
        value: result.finalTotal,
        currency: 'PYG',
        ...metaContent(prev.item),
        num_items: prev.item.quantity,
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
          const [em, ph, external_id, fn, ln, ct, country] = await Promise.all([
            hashEmail(effectiveEmail),
            hashPhoneE164(prev.phone),
            hashExternalId(prev.orderNumber),
            hashFirstName(prev.name),
            hashLastName(prev.name),
            hashCity(prev.location),
            hashCountry(),
          ]);
          userData = { em, ph, fn, ln, ct, country, external_id, fbc: getFbc(), fbp: getFbp() };
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
    item: lensItem(DEFAULT_BUNDLE_INDEX, [DEFAULT_VARIANT]) as CheckoutItem,
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
  }), []);

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
    // comprar, asi que sale del item congelado y no del pack seleccionado en
    // la landing: quien entro por el clip-on nunca eligio un pack.
    notifyCheckoutStarted({
      name: data.name,
      phone: data.phone,
      location: data.location,
      address: data.address,
      lat: data.lat,
      long: data.long,
      bundleLabel:
        checkoutItem.product === "lentes"
          ? BUNDLES[selectedBundleIndex].label
          : `NOCTE® ${CLIP_ON.name}`,
      quantity: checkoutItem.quantity,
      price: checkoutItem.amount,
      colors: checkoutItem.product === "lentes" ? checkoutItem.colors : undefined,
    });

    setShowPhoneForm(false);
    setShowStripeCheckout(true); // Show payment with all info collected
  }, [checkoutItem, selectedBundleIndex]);

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
    const lines: OrderLine[] = checkoutData.lines ?? [checkoutData.item];

    return {
      orderNumber: checkoutData.orderNumber,
      products: describeOrderLines(lines),
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

  // Scroll detection for header - uses ref to avoid re-renders on every scroll
  const lastScrollYRef = useRef(0);
  const [showHeader, setShowHeader] = useState(true);

  // El badge de autoridad se comparte entre el hero y el header, asi que su
  // estado vive aca arriba: los dos puntos de montaje lo tienen que ver.
  const [badgeCollapsed, setBadgeCollapsed] = useState(false);
  const [badgeDocked, setBadgeDocked] = useState(false);

  // La cuenta para encogerlo arranca cuando el preloader se va, no al montar.
  // Antes corria debajo del overlay y el badge llegaba a la pantalla ya
  // colapsado: nadie alcanzaba a leer que decia.
  useEffect(() => {
    let collapse: ReturnType<typeof setTimeout> | undefined;
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      collapse = setTimeout(() => setBadgeCollapsed(true), 4200);
    };
    if (document.documentElement.dataset.npl === "done") start();
    window.addEventListener("nocte:ready", start, { once: true });
    // El preloader puede no estar (build sin el, o ya removido). Sin este
    // respaldo el badge se quedaria abierto para siempre.
    const fallback = setTimeout(start, 2600);
    return () => {
      clearTimeout(fallback);
      clearTimeout(collapse);
      window.removeEventListener("nocte:ready", start);
    };
  }, []);

  // Tocar la galeria es la senal de que el cliente esta mirando las fotos. El
  // badge se va al header y no vuelve: una vez que estorbo, estorbo.
  const handleGalleryInteract = useCallback(() => {
    setBadgeCollapsed(true);
    setBadgeDocked(true);
    // El header se esconde al scrollear hacia abajo. Si el badge aterriza en un
    // header oculto, el vuelo termina fuera de pantalla y se lee como que
    // desaparecio.
    setShowHeader(true);
  }, []);


  useEffect(() => {
    let ticking = false;
    let mounted = true;

    const controlNavbar = () => {
      if (!mounted) return;
      const currentScrollY = window.scrollY;
      const lastY = lastScrollYRef.current;

      if (currentScrollY > lastY && currentScrollY > 50) {
        setShowHeader(false);
      } else if (currentScrollY < lastY) {
        setShowHeader(true);
      }

      lastScrollYRef.current = currentScrollY;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(controlNavbar);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      mounted = false;
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-foreground">
      {/* Delivery Banner */}
      <DeliveryBanner />

      {/* Header */}
      <header
        className={`fixed left-0 w-full z-50 transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-[150%]'
          } top-[36px] md:top-[40px]`}
      >
        {/* We want the header to be transparent. bg-transparent. */}
        <div className="w-full">
          <div className="container relative max-w-[1400px] mx-auto px-4 md:px-6 lg:px-12 py-2 md:py-3 flex items-center justify-end">
            {/* El wordmark va como marca vectorial, no como texto: es el logo,
                no una palabra. El drop-shadow lo sostiene sobre las fotos claras
                sin recurrir a mix-blend-difference, que obliga al compositor a
                leer el fondo en cada frame y este header es fixed. */}
            {/* La marca va centrada en el viewport, no en el hueco que le deja
                el CTA: por eso es absoluta y no un item mas del flex. */}
            {/* Marca y badge viajan como un bloque centrado: el badge se
                cuelga a la izquierda del wordmark con right-full, asi la marca
                queda en el centro exacto del viewport se pose o no el badge. */}
            <div className="pointer-events-none absolute left-1/2 flex -translate-x-1/2 items-center">
              {badgeDocked && (
                <AuthorityBadge
                  collapsed
                  docked
                  className="absolute right-full mr-2"
                />
              )}
              <NocteMark className="h-[22px] w-auto text-white md:h-[26px] [filter:drop-shadow(0_1px_10px_rgba(0,0,0,0.6))]" />
            </div>
            {ALL_VARIANTS_SOLD_OUT ? (
              <span className="text-white font-medium text-sm md:text-base tracking-tight">
                Agotado
              </span>
            ) : (
              <button
                onClick={handleBuyClick}
                onMouseEnter={preloadCheckoutChunks}
                onFocus={preloadCheckoutChunks}
                onTouchStart={preloadCheckoutChunks}
                className="text-variant-active hover:text-variant-active/80 font-medium text-sm md:text-base transition-colors tracking-tight"
              >
                Comprar Ahora
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-0 pb-0 transition-all duration-300">
        <HeroSection
          onBuyClick={handleBuyClick}
          selectedBundleIndex={selectedBundleIndex}
          onBundleSelect={handleBundleSelect}
          selectedPrice={selectedPrice}
          selectedQuantity={selectedQuantity}
          picks={picks}
          onPickChange={handlePickChange}
          badgeCollapsed={badgeCollapsed}
          badgeDocked={badgeDocked}
          onGalleryInteract={handleGalleryInteract}
        />

        {/*
          ORDEN DE LA PAGINA. Cada seccion responde UNA objecion y va en el
          orden en que la objecion aparece en la cabeza del cliente:

            1. ¿esto es para mi?      -> ProblemSection
            2. ¿por que me pasa?      -> BlueLightMorph
            3. ¿de verdad funciona?   -> ProductVideo (prueba fisica)
            4. ¿que gano yo?          -> BenefitsSection
            5. ¿le sirvio a alguien?  -> Testimonials, y despues Celebrities
            6. ¿cual me llevo?        -> MomentsSection
            7. ¿es complicado usarlo? -> LifestyleSection
            8. ¿que me llega?         -> UnboxingSection
            9. ¿por que cuesta esto?  -> ComparisonTable
           10. ¿y si no me sirve?     -> FAQ y Guarantee

          Mover una seccion sin mover su objecion rompe la cadena: el precio
          antes de la prueba se lee caro, y la eleccion de color antes del
          deseo es una decision que todavia no le importa a nadie.
        */}

        <Suspense fallback={null}>
          <ProblemSection />
        </Suspense>

        <Suspense fallback={null}>
          <BlueLightMorph />
        </Suspense>

        {/* ScienceDemo oculto: duplica el demo de espectro por color de BlueLightMorph. */}

        <Suspense fallback={null}>
          <ProductVideo />
        </Suspense>

        <Suspense fallback={null}>
          <BenefitsSection />
        </Suspense>

        <Suspense fallback={null}>
          <TestimonialsSection />
        </Suspense>

        <Suspense fallback={null}>
          <CelebritiesMarquee />
        </Suspense>

        <Suspense fallback={null}>
          <MomentsSection onPickChange={handlePickChange} />
        </Suspense>

        <Suspense fallback={null}>
          <LifestyleSection />
        </Suspense>

        {/* CTA 1: cae cuando el cliente ya sabe cual es el suyo y como se usa. */}
        <OfferCTA
          onBuyClick={handleBuyClick}
          selectedPrice={selectedPrice}
          headline="Ya sabés cuál te toca. Llevátelo."
        />

        <Suspense fallback={null}>
          <UnboxingSection />
        </Suspense>

        <Suspense fallback={null}>
          <ComparisonTable />
        </Suspense>

        {/* CTA 2: cae con el precio recien justificado, asi que reencuadra el precio. */}
        <OfferCTA
          onBuyClick={handleBuyClick}
          selectedPrice={selectedPrice}
          headline="Más caro que un genérico. Más barato que otra noche sin dormir."
        />

        {/* La objecion de la receta, contestada justo antes del FAQ que la
            plantea. Ver el comentario del componente para el porque del lugar. */}
        <Suspense fallback={null}>
          <ClipOnSection onBuyClick={handleClipOnBuyClick} />
        </Suspense>

        <Suspense fallback={null}>
          <FAQSection />
        </Suspense>

        <Suspense fallback={null}>
          <GuaranteeSection onBuyClick={handleBuyClick} />
        </Suspense>

      </main>

      {/* Sticky Buy Button */}
      <StickyBuyButton onBuyClick={handleBuyClick} selectedPrice={selectedPrice} />

      {/* WhatsApp Button */}
      <WhatsAppButton />

      {/* Checkout Modals - Lazy loaded */}
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
            onClose={() => {
              setShowExitIntent(false);
              setCheckoutInProgress(false);
            }}
          />
        </Suspense>
      )}

      {/* Footer */}
      <footer className="bg-black border-t border-border/30 py-12 md:py-16 px-4 md:px-6 pb-32 md:pb-40">
        <div className="container max-w-[1400px] mx-auto text-center space-y-5 md:space-y-6">
          <NocteMark className="mx-auto h-4 w-auto text-white md:h-[18px]" />
          <p className="text-muted-foreground font-light text-xs md:text-sm">
            Usalos antes de dormir. Dormí profundo.
          </p>

          {/* Legal Links */}
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <Link
              to="/terminos-y-condiciones"
              className="hover:text-white transition-colors"
            >
              Términos y Condiciones
            </Link>
            <span className="text-muted-foreground">|</span>
            <Link
              to="/politica-de-privacidad"
              className="hover:text-white transition-colors"
            >
              Política de Privacidad
            </Link>
          </div>

          <p className="text-[10px] md:text-xs text-muted-foreground font-light">
            © {new Date().getFullYear()} NOCTE® Todos los Derechos Reservados
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
