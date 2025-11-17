import { useState, useEffect, useMemo, lazy, Suspense } from "react";
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
const ProductGallery = lazy(() => import("@/components/ProductGallery"));
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

const Index = () => {
  // UI state
  const [isBannerVisible, setIsBannerVisible] = useState(true);

  // Checkout state management
  const [showQuantitySelector, setShowQuantitySelector] = useState(false);
  const [showStripeCheckout, setShowStripeCheckout] = useState(false);
  const [showPaymentFallback, setShowPaymentFallback] = useState(false);
  const [showPhoneForm, setShowPhoneForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [checkoutInProgress, setCheckoutInProgress] = useState(false);

  const [checkoutData, setCheckoutData] = useState({
    quantity: 1,
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
        e.returnValue = "Tienes un pedido en proceso. Si sales ahora, perderás tu pedido.";
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

  const handleBuyClick = () => {
    // Track InitiateCheckout when user clicks buy button
    trackInitiateCheckout();
    setShowQuantitySelector(true);
  };

  const handleQuantitySelected = (quantity: number) => {
    setCheckoutData((prev) => ({ ...prev, quantity }));
    setShowQuantitySelector(false);

    // Track AddToCart
    const value = 279000 * quantity;
    trackAddToCart({
      content_name: quantity === 1
        ? 'NOCTE® Red Light Blocking Glasses'
        : `NOCTE® Red Light Blocking Glasses - Pack x${quantity}`,
      content_ids: quantity === 1
        ? ['nocte-red-glasses']
        : [`nocte-red-glasses-${quantity}pack`],
      num_items: quantity,
      value,
      currency: 'PYG',
    });

    setCheckoutInProgress(true);
    setShowPhoneForm(true); // Go directly to phone/location form
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    // STEP 4: Payment successful - now send order to n8n and show success
    setShowStripeCheckout(false);
    setCheckoutData((prev) => ({ ...prev, paymentIntentId }));

    // Calculate total
    const totalAmount = 279000 * checkoutData.quantity;

    // Send order to n8n webhook with all collected data
    try {
      console.log('📦 Sending completed order to n8n...');

      const orderData = {
        name: checkoutData.name,
        phone: checkoutData.phone,
        location: checkoutData.location,
        address: checkoutData.address,
        lat: checkoutData.lat,
        long: checkoutData.long,
        quantity: checkoutData.quantity,
        total: totalAmount,
        orderNumber: checkoutData.orderNumber,
        paymentIntentId: paymentIntentId,
        email: undefined,
        paymentType: 'Card' as const,
        deliveryType: 'común' as const,
      };

      const result = await sendOrderToN8N(orderData);

      if (!result.success) {
        console.error('❌ Failed to send order to n8n:', result.error);
      } else {
        console.log('✅ Order sent to n8n successfully:', result);
      }
    } catch (error) {
      console.error('❌ Error sending order to n8n:', error);
    }

    // Track Purchase conversion event
    trackPurchase({
      value: totalAmount,
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

    setShowSuccess(true);
  };

  const handleBackToPhoneForm = () => {
    setShowStripeCheckout(false);
    setShowPhoneForm(true);
  };

  const handleStripeCheckoutClose = () => {
    setShowStripeCheckout(false);
    setCheckoutInProgress(false);
    // Reset checkout state when user cancels
    setCheckoutData({
      quantity: 1,
      colors: null,
      location: "",
      name: "",
      phone: "",
      address: "",
      paymentMethod: "digital",
      orderNumber: generateOrderNumber(),
      paymentIntentId: "",
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
    // Reset checkout state when user cancels
    setCheckoutData({
      quantity: 1,
      colors: null,
      location: "",
      name: "",
      phone: "",
      address: "",
      paymentMethod: "digital",
      orderNumber: generateOrderNumber(),
      paymentIntentId: "",
    });
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    setCheckoutInProgress(false); // Deactivate protection
    // Reset checkout state
    setCheckoutData({
      quantity: 1,
      colors: null,
      location: "",
      name: "",
      phone: "",
      address: "",
      paymentMethod: "digital",
      orderNumber: generateOrderNumber(),
      paymentIntentId: "",
    });
  };

  const orderData = useMemo(() => {
    // Calculate total
    const totalAmount = 279000 * checkoutData.quantity;

    return {
      orderNumber: checkoutData.orderNumber,
      products: `${checkoutData.quantity}x NOCTE® Red Light Blocking Glasses`,
      total: `${totalAmount.toLocaleString('es-PY')} Gs`,
      location: checkoutData.location,
      phone: checkoutData.phone,
      name: checkoutData.name,
    };
  }, [checkoutData]);

  return (
    <div className="min-h-screen bg-black text-foreground">
      {/* Delivery Banner */}
      <DeliveryBanner onVisibilityChange={setIsBannerVisible} />

      {/* Header */}
      <header className={`fixed ${isBannerVisible ? 'top-[36px] md:top-[40px]' : 'top-0'} w-full bg-black/60 backdrop-blur-xl border-b border-border/30 z-50 transition-all duration-300`}>
        <div className="container max-w-[1400px] mx-auto px-4 md:px-6 lg:px-12 py-4 md:py-5 flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tighter">NOCTE<sup className="text-[0.5em] ml-0.5">®</sup> PARAGUAY</h1>
          <button
            onClick={handleBuyClick}
            className="text-primary hover:text-primary/80 font-medium text-sm md:text-base transition-colors tracking-tight"
          >
            Comprar Ahora
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className={`${isBannerVisible ? 'pt-[100px] md:pt-[108px]' : 'pt-16 md:pt-20'} transition-all duration-300`}>
        <HeroSection onBuyClick={handleBuyClick} />

        <Suspense fallback={<div className="h-96" />}>
          <ProductGallery />
        </Suspense>

        <Suspense fallback={<div className="h-96" />}>
          <ScienceSection />
        </Suspense>

        <Suspense fallback={<div className="h-96" />}>
          <BenefitsSection />
        </Suspense>

        {/* CTA 1: After Benefits */}
        <OfferCTA onBuyClick={handleBuyClick} />

        <Suspense fallback={<div className="h-96" />}>
          <LifestyleSection />
        </Suspense>

        <Suspense fallback={<div className="h-96" />}>
          <ComparisonTable />
        </Suspense>

        {/* CTA 2: After Comparison */}
        <OfferCTA onBuyClick={handleBuyClick} />

        <Suspense fallback={<div className="h-96" />}>
          <TestimonialsSection />
        </Suspense>

        {/* CTA 3: After Testimonials (minimal) */}
        <OfferCTA onBuyClick={handleBuyClick} variant="minimal" />

        <Suspense fallback={<div className="h-96" />}>
          <FAQSection />
        </Suspense>

        <Suspense fallback={<div className="h-96" />}>
          <GuaranteeSection onBuyClick={handleBuyClick} />
        </Suspense>
      </main>

      {/* Sticky Buy Button */}
      <StickyBuyButton onBuyClick={handleBuyClick} />

      {/* WhatsApp Button */}
      <WhatsAppButton phoneNumber="+595983912902" />

      {/* Checkout Modals - Lazy loaded */}
      {showQuantitySelector && (
        <Suspense fallback={null}>
          <QuantitySelector
            isOpen={showQuantitySelector}
            onClose={() => setShowQuantitySelector(false)}
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
            amount={279000 * checkoutData.quantity}
            currency="pyg"
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
            onPayOnDelivery={() => {}}
            onRetryPayment={() => {}}
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
            Úsalos antes de dormir. Duerme profundo.
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
