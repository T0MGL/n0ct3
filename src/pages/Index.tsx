import { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { DeliveryBanner } from "@/components/DeliveryBanner";
import { HeroSection } from "@/components/HeroSection";
import { StickyBuyButton } from "@/components/StickyBuyButton";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { OfferCTA } from "@/components/OfferCTA";
import { sendOrderInBackground, generateOrderNumber } from "@/services/orderService";
import {
  trackInitiateCheckout,
  trackAddToCart,
  trackPurchase,
} from "@/lib/meta-pixel";
import { BUNDLES, DEFAULT_BUNDLE_INDEX } from "@/lib/bundles";
import { useExitIntent } from "@/hooks/useExitIntent";

// Lazy load heavy sections that are below the fold
const CelebritiesMarquee = lazy(() => import("@/components/CelebritiesMarquee"));
const ProductVideo = lazy(() => import("@/components/ProductVideo"));
const ScienceSection = lazy(() => import("@/components/ScienceSection"));
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


const defaultBundle = BUNDLES[DEFAULT_BUNDLE_INDEX];

const Index = () => {
  // Bundle selection state (visible on landing page)
  const [selectedBundleIndex, setSelectedBundleIndex] = useState(DEFAULT_BUNDLE_INDEX);

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

  const [checkoutData, setCheckoutData] = useState({
    quantity: defaultBundle.quantity,
    totalPrice: defaultBundle.price,
    colors: null as [string, string] | null,
    location: "",
    name: "",
    phone: "",
    address: "",
    lat: undefined as number | undefined,
    long: undefined as number | undefined,
    paymentMethod: "digital" as "digital" | "cash",
    orderNumber: "",
    paymentIntentId: "",
  });

  // Detect exit intent during checkout — show WhatsApp downsell
  const isInCheckout = checkoutInProgress || showPhoneForm || showStripeCheckout;
  useExitIntent({
    onExitIntent: () => {
      if (isInCheckout && !showSuccess && !exitIntentShown && !showExitIntent) {
        setShowPhoneForm(false);
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
        e.returnValue = "Tienes un pedido en proceso. Si sales ahora, perderás tu progreso.";
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
    setSelectedBundleIndex(index);
  }, []);

  const handleBuyClick = useCallback(() => {
    const bundle = BUNDLES[selectedBundleIndex];

    setCheckoutInProgress(true);
    setCheckoutData((prev) => ({ ...prev, quantity: bundle.quantity, totalPrice: bundle.price }));

    // Track AddToCart
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

    // Go directly to phone form (skip QuantitySelector)
    setShowPhoneForm(true);

    // Preload Stripe checkout and exit intent modal
    import("@/components/checkout/StripeCheckoutModal");
    import("@/components/checkout/ExitIntentModal");
  }, [selectedBundleIndex]);

  const handlePaymentSuccess = useCallback((result: {
    paymentIntentId: string;
    paymentType: 'Card' | 'COD';
    isPaid: boolean;
    deliveryType: 'común' | 'premium';
    finalTotal: number;
  }) => {
    // INSTANT transition - no waiting for API calls
    setCheckoutData((prev) => {
      // Send order to backend in background (fire-and-forget)
      sendOrderInBackground({
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
        email: undefined,
        paymentType: result.paymentType,
        isPaid: result.isPaid,
        deliveryType: result.deliveryType,
      });

      // Track Purchase conversion event (also non-blocking)
      trackPurchase({
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
      });

      return { ...prev, paymentIntentId: result.paymentIntentId, totalPrice: result.finalTotal };
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
    paymentMethod: "digital" as "digital" | "cash",
    orderNumber: generateOrderNumber(),
    paymentIntentId: "",
    lat: undefined as number | undefined,
    long: undefined as number | undefined,
    ruc: undefined as string | undefined,
  }), []);

  const handleStripeCheckoutClose = useCallback(() => {
    setShowStripeCheckout(false);
    setCheckoutInProgress(false);
    setCheckoutData(resetCheckoutData());
  }, [resetCheckoutData]);

  const handlePhoneSubmit = useCallback((data: { name: string; phone: string; location: string; address: string; lat?: number; long?: number; ruc?: string }) => {
    // Store personal info and location, then proceed to payment
    setCheckoutData((prev) => ({
      ...prev,
      name: data.name,
      phone: data.phone,
      location: data.location,
      address: data.address,
      lat: data.lat,
      long: data.long,
      ruc: data.ruc,
    }));

    setShowPhoneForm(false);
    setShowStripeCheckout(true); // Show payment with all info collected
  }, []);

  const handlePhoneFormClose = useCallback(() => {
    setShowPhoneForm(false);
    setCheckoutInProgress(false);
    setCheckoutData(resetCheckoutData());
  }, [resetCheckoutData]);

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

    return {
      orderNumber: checkoutData.orderNumber,
      products: `${checkoutData.quantity}x NOCTE® Red Light Blocking Glasses`,
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
    orderNumber: checkoutData.orderNumber,
    quantity: checkoutData.quantity,
  }), [checkoutData.name, checkoutData.phone, checkoutData.location, checkoutData.address, checkoutData.orderNumber, checkoutData.quantity]);

  // Scroll detection for header - uses ref to avoid re-renders on every scroll
  const lastScrollYRef = useRef(0);
  const [showHeader, setShowHeader] = useState(true);

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
          <div className="container max-w-[1400px] mx-auto px-4 md:px-6 lg:px-12 py-2 md:py-3 flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tighter mix-blend-difference text-white">NOCTE<sup className="text-[0.5em] ml-0.5">®</sup> PARAGUAY</h1>
            <button
              onClick={handleBuyClick}
              className="text-primary hover:text-primary/80 font-medium text-sm md:text-base transition-colors tracking-tight"
            >
              Comprar Ahora
            </button>
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
        />

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
          <ScienceSection />
        </Suspense>

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
          <p className="text-2xl font-bold tracking-tighter opacity-70">NOCTE<sup className="text-[0.5em] ml-0.5">®</sup></p>
          <p className="text-muted-foreground font-light text-xs md:text-sm">
            Úsalos antes de dormir. Dormí profundo.
          </p>

          {/* Legal Links */}
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground/60">
            <Link
              to="/terminos-y-condiciones"
              className="hover:text-white transition-colors"
            >
              Términos y Condiciones
            </Link>
            <span className="text-muted-foreground/30">|</span>
            <Link
              to="/politica-de-privacidad"
              className="hover:text-white transition-colors"
            >
              Política de Privacidad
            </Link>
          </div>

          <p className="text-[10px] md:text-xs text-muted-foreground/60 font-light">
            © {new Date().getFullYear()} NOCTE® Todos los Derechos Reservados
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
