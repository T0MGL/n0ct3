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
import { ALL_VARIANTS_SOLD_OUT, DEFAULT_VARIANT, resolveSelectableVariant, summarizeVariantCounts, type VariantId } from "@/lib/variants";
import { useExitIntent } from "@/hooks/useExitIntent";
import { getStripe } from "@/lib/stripe";

// How long the Purchase pixel waits for /api/send-order to hand back the
// server event id before falling back to the legacy pixel.
const PURCHASE_ID_WAIT_MS = 6000;

// Preload Stripe.js immediately so it's ready when the user clicks buy
getStripe();

// Lazy load heavy sections that are below the fold
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
    quantity: defaultBundle.quantity,
    totalPrice: defaultBundle.price,
    colors: null as string[] | null,
    location: "",
    name: "",
    phone: "",
    address: "",
    isGeolocated: false,
    lat: undefined as number | undefined,
    long: undefined as number | undefined,
    paymentMethod: "digital" as "digital" | "cash",
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

  // Keep picks array sized to selectedQuantity. Preserve any colors already chosen,
  // pad with the first pick (or DEFAULT_VARIANT) when growing.
  useEffect(() => {
    setPicks((prev) => {
      if (prev.length === selectedQuantity) return prev;
      if (prev.length > selectedQuantity) return prev.slice(0, selectedQuantity);
      const fill = prev[0] ?? DEFAULT_VARIANT;
      return [
        ...prev,
        ...Array.from({ length: selectedQuantity - prev.length }, () => fill),
      ];
    });
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
  useEffect(() => {
    if (showPhoneForm && checkoutData.quantity > 0) {
      trackInitiateCheckout({
        content_name: checkoutData.quantity === 1
          ? 'NOCTE® Red Light Blocking Glasses'
          : `NOCTE® Red Light Blocking Glasses - Pack x${checkoutData.quantity}`,
        content_ids: checkoutData.quantity === 1
          ? ['nocte-red-glasses']
          : [`nocte-red-glasses-${checkoutData.quantity}pack`],
        num_items: checkoutData.quantity,
        value: checkoutData.totalPrice,
        currency: 'PYG',
      });
    }
  }, [showPhoneForm, checkoutData.quantity, checkoutData.totalPrice]);

  const handleBundleSelect = useCallback((index: number) => {
    // Only emit AddToCart when the user actually switches to a different pack.
    // Re-clicking the already-selected pack is a no-op so we never flood Meta
    // with redundant events, and Personal (the default) never fires ATC from
    // here because it is pre-selected.
    if (index !== selectedBundleIndex) {
      const bundle = BUNDLES[index];
      trackAddToCart({
        content_name: bundle.quantity === 1
          ? 'NOCTE® Red Light Blocking Glasses'
          : `NOCTE® Red Light Blocking Glasses - Pack x${bundle.quantity}`,
        content_ids: bundle.quantity === 1
          ? ['nocte-red-glasses']
          : [`nocte-red-glasses-${bundle.quantity}pack`],
        num_items: bundle.quantity,
        value: bundle.price,
        currency: 'PYG',
      });
      setAtcFired(true);
    }
    setSelectedBundleIndex(index);
  }, [selectedBundleIndex]);

  const startBuyFlow = useCallback((bundleIndex: number, hasAtcFired: boolean) => {
    // Hard gate: with every color sold out there is nothing sellable, so the
    // checkout never opens no matter which CTA fired the click.
    if (ALL_VARIANTS_SOLD_OUT) return;

    const bundle = BUNDLES[bundleIndex];

    // Snapshot the per-unit colors at the moment of buy so the checkout payload
    // stays stable even if the user reopens the picker afterwards.
    // resolveSelectableVariant is the final gate: a sold-out color can never
    // reach the order payload, even if a stale pick slipped past the UI.
    const colorsSnapshot = Array.from(
      { length: bundle.quantity },
      (_, i) => resolveSelectableVariant(picks[i] ?? picks[0] ?? DEFAULT_VARIANT),
    );

    setCheckoutInProgress(true);
    setSelectedBundleIndex(bundleIndex);
    setCheckoutData((prev) => ({
      ...prev,
      quantity: bundle.quantity,
      totalPrice: bundle.price,
      colors: colorsSnapshot,
    }));

    if (!hasAtcFired) {
      trackAddToCart({
        content_name: bundle.quantity === 1
          ? 'NOCTE® Red Light Blocking Glasses'
          : `NOCTE® Red Light Blocking Glasses - Pack x${bundle.quantity}`,
        content_ids: bundle.quantity === 1
          ? ['nocte-red-glasses']
          : [`nocte-red-glasses-${bundle.quantity}pack`],
        num_items: bundle.quantity,
        value: bundle.price,
        currency: 'PYG',
      });
      setAtcFired(true);
    }

    setShowPhoneForm(true);

    import("@/components/checkout/StripeCheckoutModal");
    import("@/components/checkout/ExitIntentModal");
  }, [picks]);

  const handleBuyClick = useCallback(() => {
    startBuyFlow(selectedBundleIndex, atcFired);
  }, [startBuyFlow, selectedBundleIndex, atcFired]);

  const handlePaymentSuccess = useCallback((result: {
    paymentIntentId: string;
    paymentType: 'Card' | 'COD';
    isPaid: boolean;
    deliveryType: 'común' | 'premium';
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
        quantity: prev.quantity,
        total: result.finalTotal,
        orderNumber: prev.orderNumber,
        paymentIntentId: result.paymentIntentId,
        email: effectiveEmail,
        paymentType: result.paymentType,
        isPaid: result.isPaid,
        deliveryType: result.deliveryType,
        colors: prev.colors ?? undefined,
        fbp: getFbp(),
        fbc: getFbc(),
      });

      const purchaseParams = {
        value: result.finalTotal,
        currency: 'PYG',
        content_name: prev.quantity === 1
          ? 'NOCTE® Red Light Blocking Glasses'
          : `NOCTE® Red Light Blocking Glasses - Pack x${prev.quantity}`,
        content_ids: prev.quantity === 1
          ? ['nocte-red-glasses']
          : [`nocte-red-glasses-${prev.quantity}pack`],
        num_items: prev.quantity,
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

      return { ...prev, paymentIntentId: result.paymentIntentId, totalPrice: result.finalTotal, email: effectiveEmail };
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
    quantity: defaultBundle.quantity,
    totalPrice: defaultBundle.price,
    colors: null as [string, string] | null,
    location: "",
    name: "",
    phone: "",
    address: "",
    isGeolocated: false,
    paymentMethod: "digital" as "digital" | "cash",
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

    const bundle = BUNDLES[selectedBundleIndex];
    const colorsSnapshot = Array.from(
      { length: bundle.quantity },
      (_, i) => resolveSelectableVariant(picks[i] ?? picks[0] ?? DEFAULT_VARIANT),
    );
    notifyCheckoutStarted({
      name: data.name,
      phone: data.phone,
      location: data.location,
      address: data.address,
      lat: data.lat,
      long: data.long,
      bundleLabel: bundle.label,
      quantity: bundle.quantity,
      price: bundle.price,
      colors: colorsSnapshot,
    });

    setShowPhoneForm(false);
    setShowStripeCheckout(true); // Show payment with all info collected
  }, [selectedBundleIndex, picks]);

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

    // Break the order down per chosen color so a mixed pack (e.g. 1 amarillo +
    // 1 rojo) lists each variant with its own emoji and count, instead of
    // collapsing everything into one generic line. Falls back to the default
    // variant filled to quantity when no explicit picks were captured.
    const picks: VariantId[] = (
      (checkoutData.colors as VariantId[] | null)?.length
        ? (checkoutData.colors as VariantId[])
        : Array.from({ length: checkoutData.quantity }, () => DEFAULT_VARIANT)
    ).map(resolveSelectableVariant);

    const products = summarizeVariantCounts(picks)
      .map(({ variant, count }) => `${variant.emoji} ${count}x ${variant.productName}`)
      .join('\n');

    return {
      orderNumber: checkoutData.orderNumber,
      products,
      total: `${checkoutData.totalPrice.toLocaleString('es-PY')} Gs`,
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
    quantity: checkoutData.quantity,
    email: checkoutData.email,
    colors: checkoutData.colors ?? undefined,
  }), [checkoutData.name, checkoutData.phone, checkoutData.location, checkoutData.address, checkoutData.isGeolocated, checkoutData.orderNumber, checkoutData.quantity, checkoutData.email, checkoutData.colors]);

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

        {/* Va pegado al hero: el h1 promete un lente por momento y esta es la
            seccion que lo cumple. Cualquier cosa en el medio (la prueba social,
            el video) hace que la promesa quede sin cobrar. */}
        <Suspense fallback={null}>
          <MomentsSection onPickChange={handlePickChange} />
        </Suspense>

        <Suspense fallback={null}>
          <CelebritiesMarquee />
        </Suspense>

        <Suspense fallback={null}>
          <ProductVideo />
        </Suspense>

        <Suspense fallback={null}>
          <UnboxingSection />
        </Suspense>

        <Suspense fallback={null}>
          <BlueLightMorph />
        </Suspense>

        {/* ScienceDemo oculto: duplica el demo de espectro por color de BlueLightMorph. */}

        <Suspense fallback={null}>
          <BenefitsSection />
        </Suspense>

        {/* CTA 1: After Benefits */}
        <OfferCTA onBuyClick={handleBuyClick} selectedPrice={selectedPrice} />

        <Suspense fallback={null}>
          <LifestyleSection />
        </Suspense>

        <Suspense fallback={null}>
          <ComparisonTable />
        </Suspense>

        {/* CTA 2: After Comparison */}
        <OfferCTA onBuyClick={handleBuyClick} selectedPrice={selectedPrice} />

        <Suspense fallback={null}>
          <TestimonialsSection />
        </Suspense>

        {/* CTA 3: After Testimonials (minimal) */}
        <OfferCTA onBuyClick={handleBuyClick} variant="minimal" selectedPrice={selectedPrice} />

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
            amount={checkoutData.totalPrice}
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
            Úsalos antes de dormir. Dormí profundo.
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
