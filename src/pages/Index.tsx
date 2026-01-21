import { useState, useEffect, useMemo, lazy, Suspense, memo } from "react";
import { DeliveryBanner } from "@/components/DeliveryBanner";
import { HeroSection } from "@/components/HeroSection";
import { StickyBuyButton } from "@/components/StickyBuyButton";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { OfferCTA } from "@/components/OfferCTA";
import { sendOrderToN8N, generateOrderNumber } from "@/services/orderService";
import {
  trackInitiateCheckout,
  trackAddToCart,
  trackAddPaymentInfo,
  trackPurchase,
} from "@/lib/meta-pixel";

// Lazy load heavy sections that are below the fold
const CelebritiesMarquee = lazy(() => import("@/components/CelebritiesMarquee"));
const ProductGallery = lazy(() => import("@/components/ProductGallery"));
const ProductVideo = lazy(() => import("@/components/ProductVideo"));
const ScienceSection = lazy(() => import("@/components/ScienceSection"));
const BenefitsSection = lazy(() => import("@/components/BenefitsSection"));
const LifestyleSection = lazy(() => import("@/components/LifestyleSection"));
const ComparisonTable = lazy(() => import("@/components/ComparisonTable"));
const TestimonialsSection = lazy(() => import("@/components/TestimonialsSection"));
const FAQSection = lazy(() => import("@/components/FAQSection"));
const GuaranteeSection = lazy(() => import("@/components/GuaranteeSection"));

// Lazy load checkout modals (only loaded when user clicks buy)
const QuantitySelector = lazy(() => import("@/components/checkout/QuantitySelector").then(module => ({ default: module.QuantitySelector })));
const PhoneNameForm = lazy(() => import("@/components/checkout/PhoneNameForm"));
const SuccessPage = lazy(() => import("@/components/checkout/SuccessPage"));
const PaymentFallbackModal = lazy(() => import("@/components/checkout/PaymentFallbackModal"));
const StripeCheckoutModal = lazy(() => import("@/components/checkout/StripeCheckoutModal"));

// Skeleton loader for lazy-loaded sections - prevents layout shift
const SectionSkeleton = memo(({ height }: { height: string }) => (
  <div className={`${height} bg-black animate-pulse`}>
    <div className="container max-w-[1400px] mx-auto px-4 py-12 md:py-20">
      <div className="h-8 md:h-10 w-48 md:w-64 bg-secondary/30 rounded mx-auto mb-8" />
      <div className="space-y-4">
        <div className="h-4 bg-secondary/20 rounded w-3/4 mx-auto" />
        <div className="h-4 bg-secondary/20 rounded w-1/2 mx-auto" />
      </div>
    </div>
  </div>
));
SectionSkeleton.displayName = 'SectionSkeleton';

const Index = () => {
  // UI state
  const [isBannerVisible, setIsBannerVisible] = useState(true);

  // Checkout state management
  const [showQuantitySelector, setShowQuantitySelector] = useState(false);
  const [showStripeCheckout, setShowStripeCheckout] = useState(false);
  const [showPaymentFallback, setShowPaymentFallback] = useState(false);
  const [showPhoneForm, setShowPhoneForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [checkoutInProgress, setCheckoutInProgress] = useState(false);

  const [checkoutData, setCheckoutData] = useState({
    quantity: 1,
    totalPrice: 199000, // Default to single unit price
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

  const handleBuyClick = () => {
    setCheckoutInProgress(true); // Start checkout progress tracking
    setShowQuantitySelector(true);

    // Preload next modals for seamless transition
    import("@/components/checkout/PhoneNameForm");
    import("@/components/checkout/StripeCheckoutModal");
  };

  const handleQuantitySelected = (quantity: number, totalPrice: number) => {
    setCheckoutData((prev) => ({ ...prev, quantity, totalPrice }));
    setShowQuantitySelector(false);

    // Track AddToCart when user selects quantity
    trackAddToCart({
      content_name: quantity === 1
        ? 'NOCTE® Red Light Blocking Glasses'
        : `NOCTE® Red Light Blocking Glasses - Pack x${quantity}`,
      content_ids: quantity === 1
        ? ['nocte-red-glasses']
        : [`nocte-red-glasses-${quantity}pack`],
      num_items: quantity,
      value: totalPrice,
      currency: 'PYG',
    });

    // Open phone form immediately
    // InitiateCheckout will be tracked when the form opens
    setShowPhoneForm(true);
  };

  const handlePaymentSuccess = async (result: {
    paymentIntentId: string;
    paymentType: 'Card' | 'COD';
    isPaid: boolean;
    deliveryType: 'común' | 'premium';
    finalTotal: number;
  }) => {
    // STEP 4: Payment successful - show loading while processing
    setIsProcessingOrder(true);
    setCheckoutData((prev) => ({ ...prev, paymentIntentId: result.paymentIntentId }));

    // Send order to backend (which handles n8n and Ordefy)
    try {
      console.log('📦 Sending completed order...', {
        paymentType: result.paymentType,
        isPaid: result.isPaid,
        deliveryType: result.deliveryType,
      });

      const orderData = {
        name: checkoutData.name,
        phone: checkoutData.phone,
        location: checkoutData.location,
        address: checkoutData.address,
        lat: checkoutData.lat,
        long: checkoutData.long,
        quantity: checkoutData.quantity,
        total: result.finalTotal,
        orderNumber: checkoutData.orderNumber,
        paymentIntentId: result.paymentIntentId,
        email: undefined,
        paymentType: result.paymentType,
        isPaid: result.isPaid,
        deliveryType: result.deliveryType,
      };

      const sendResult = await sendOrderToN8N(orderData);

      if (!sendResult.success) {
        console.error('❌ Failed to send order:', sendResult.error);
      } else {
        console.log('✅ Order sent successfully:', sendResult);
      }
    } catch (error) {
      console.error('❌ Error sending order:', error);
    }

    // Track Purchase conversion event
    trackPurchase({
      value: result.finalTotal,
      currency: 'PYG',
      content_name: checkoutData.quantity === 1
        ? 'NOCTE® Red Light Blocking Glasses'
        : `NOCTE® Red Light Blocking Glasses - Pack x${checkoutData.quantity}`,
      content_ids: checkoutData.quantity === 1
        ? ['nocte-red-glasses']
        : [`nocte-red-glasses-${checkoutData.quantity}pack`],
      num_items: checkoutData.quantity,
      order_id: checkoutData.orderNumber,
    });

    // Close Stripe modal and show success
    setIsProcessingOrder(false);
    setShowStripeCheckout(false);
    setShowSuccess(true);
  };

  const handleBackToPhoneForm = () => {
    setShowStripeCheckout(false);
    setShowPhoneForm(true);
  };

  const handleQuantitySelectorClose = () => {
    setShowQuantitySelector(false);
    setCheckoutInProgress(false);
    setCheckoutData({
      quantity: 1,
      totalPrice: 199000,
      colors: null,
      location: "",
      name: "",
      phone: "",
      address: "",
      paymentMethod: "digital",
      orderNumber: generateOrderNumber(),
      paymentIntentId: "",
      lat: undefined,
      long: undefined,
    });
  };

  const handleStripeCheckoutClose = () => {
    setShowStripeCheckout(false);
    setCheckoutInProgress(false);
    setCheckoutData({
      quantity: 1,
      totalPrice: 199000,
      colors: null,
      location: "",
      name: "",
      phone: "",
      address: "",
      paymentMethod: "digital",
      orderNumber: generateOrderNumber(),
      paymentIntentId: "",
      lat: undefined,
      long: undefined,
    });
  };

  const handlePhoneSubmit = (data: { name: string; phone: string; location: string; address: string; lat?: number; long?: number }) => {
    // Store personal info and location, then proceed to payment
    setCheckoutData((prev) => ({
      ...prev,
      name: data.name,
      phone: data.phone,
      location: data.location,
      address: data.address,
      lat: data.lat,
      long: data.long,
    }));

    setShowPhoneForm(false);
    setShowStripeCheckout(true); // Show payment with all info collected
  };

  const handlePhoneFormClose = () => {
    setShowPhoneForm(false);
    setCheckoutInProgress(false);
    setCheckoutData({
      quantity: 1,
      totalPrice: 199000,
      colors: null,
      location: "",
      name: "",
      phone: "",
      address: "",
      paymentMethod: "digital",
      orderNumber: generateOrderNumber(),
      paymentIntentId: "",
      lat: undefined,
      long: undefined,
    });
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    setCheckoutInProgress(false); // Deactivate protection
    // Reset checkout state
    setCheckoutData({
      quantity: 1,
      totalPrice: 199000,
      colors: null,
      location: "",
      name: "",
      phone: "",
      address: "",
      paymentMethod: "digital",
      orderNumber: generateOrderNumber(),
      paymentIntentId: "",
      lat: undefined,
      long: undefined,
    });
  };


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

  // Scroll detection for header
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showHeader, setShowHeader] = useState(true);

  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        const currentScrollY = window.scrollY;

        // Hide on scroll down, show on scroll up
        // Always show if very close to top to avoid flickering or getting stuck hidden at top
        if (currentScrollY > lastScrollY && currentScrollY > 50) {
          setShowHeader(false);
        } else {
          setShowHeader(true);
        }

        setLastScrollY(currentScrollY);
      }
    };

    window.addEventListener('scroll', controlNavbar);

    return () => {
      window.removeEventListener('scroll', controlNavbar);
    };
  }, [lastScrollY]);

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
              className="text-primary hover:text-primary/80 font-medium text-sm md:text-base transition-colors tracking-tight mix-blend-difference"
            >
              Comprar Ahora
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-0 pb-0 transition-all duration-300">
        <HeroSection onBuyClick={handleBuyClick} />

        <Suspense fallback={<SectionSkeleton height="h-[300px] md:h-[340px]" />}>
          <CelebritiesMarquee />
        </Suspense>

        <Suspense fallback={<SectionSkeleton height="h-[500px] md:h-[600px]" />}>
          <ProductGallery />
        </Suspense>

        <Suspense fallback={<SectionSkeleton height="h-[400px] md:h-[500px]" />}>
          <ProductVideo />
        </Suspense>

        <Suspense fallback={<SectionSkeleton height="h-[600px] md:h-[700px]" />}>
          <ScienceSection />
        </Suspense>

        <Suspense fallback={<SectionSkeleton height="h-[500px] md:h-[600px]" />}>
          <BenefitsSection />
        </Suspense>

        {/* CTA 1: After Benefits */}
        <OfferCTA onBuyClick={handleBuyClick} />

        <Suspense fallback={<SectionSkeleton height="h-[500px] md:h-[600px]" />}>
          <LifestyleSection />
        </Suspense>

        <Suspense fallback={<SectionSkeleton height="h-[600px] md:h-[700px]" />}>
          <ComparisonTable />
        </Suspense>

        {/* CTA 2: After Comparison */}
        <OfferCTA onBuyClick={handleBuyClick} />

        <Suspense fallback={<SectionSkeleton height="h-[500px] md:h-[600px]" />}>
          <TestimonialsSection />
        </Suspense>

        {/* CTA 3: After Testimonials (minimal) */}
        <OfferCTA onBuyClick={handleBuyClick} variant="minimal" />

        <Suspense fallback={<SectionSkeleton height="h-[500px] md:h-[600px]" />}>
          <FAQSection />
        </Suspense>

        <Suspense fallback={<SectionSkeleton height="h-[400px] md:h-[500px]" />}>
          <GuaranteeSection onBuyClick={handleBuyClick} />
        </Suspense>
      </main>

      {/* Sticky Buy Button */}
      <StickyBuyButton onBuyClick={handleBuyClick} />

      {/* WhatsApp Button */}
      <WhatsAppButton />

      {/* Checkout Modals - Lazy loaded */}
      {showQuantitySelector && (
        <Suspense fallback={null}>
          <QuantitySelector
            isOpen={showQuantitySelector}
            onClose={handleQuantitySelectorClose}
            onContinue={handleQuantitySelected}
          />
        </Suspense>
      )}

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
            isProcessingOrder={isProcessingOrder}
            customerData={{
              name: checkoutData.name,
              phone: checkoutData.phone,
              location: checkoutData.location,
              address: checkoutData.address,
              orderNumber: checkoutData.orderNumber,
              quantity: checkoutData.quantity,
            }}
          />
        </Suspense>
      )}

      {showPaymentFallback && (
        <Suspense fallback={null}>
          <PaymentFallbackModal
            isOpen={showPaymentFallback}
            onPayOnDelivery={() => { }}
            onRetryPayment={() => { }}
            onCancel={() => setShowPaymentFallback(false)}
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

      {/* Footer */}
      <footer className="bg-black border-t border-border/30 py-12 md:py-16 px-4 md:px-6">
        <div className="container max-w-[1400px] mx-auto text-center space-y-5 md:space-y-6">
          <p className="text-2xl font-bold tracking-tighter opacity-70">NOCTE<sup className="text-[0.5em] ml-0.5">®</sup></p>
          <p className="text-muted-foreground font-light text-xs md:text-sm">
            Úsalos antes de dormir. Dormí profundo.
          </p>

          <p className="text-[10px] md:text-xs text-muted-foreground/60 font-light">
            © 2025 NOCTE® Todos los Derechos Reservados
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
