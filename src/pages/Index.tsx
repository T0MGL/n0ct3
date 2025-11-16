import { useState, useEffect, useMemo } from "react";
import { HeroSection } from "@/components/HeroSection";
import { ScienceSection } from "@/components/ScienceSection";
import { ProductGallery } from "@/components/ProductGallery";
import { BenefitsSection } from "@/components/BenefitsSection";
import { LifestyleSection } from "@/components/LifestyleSection";
import { ComparisonTable } from "@/components/ComparisonTable";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { FAQSection } from "@/components/FAQSection";
import { GuaranteeSection } from "@/components/GuaranteeSection";
import { StickyBuyButton } from "@/components/StickyBuyButton";
import { UpsellModal } from "@/components/checkout/UpsellModal";
import { LocationModal } from "@/components/checkout/LocationModal";
import { PhoneNameForm } from "@/components/checkout/PhoneNameForm";
import { SuccessPage } from "@/components/checkout/SuccessPage";
import { PaymentFallbackModal } from "@/components/checkout/PaymentFallbackModal";
import { StripeCheckoutModal } from "@/components/checkout/StripeCheckoutModal";
import { sendOrderToN8N, generateOrderNumber } from "@/services/orderService";
import {
  trackInitiateCheckout,
  trackAddToCart,
  trackAddPaymentInfo,
  trackPurchase,
} from "@/lib/meta-pixel";

const Index = () => {
  // Checkout state management
  const [showUpsell, setShowUpsell] = useState(false);
  const [showStripeCheckout, setShowStripeCheckout] = useState(false);
  const [showPaymentFallback, setShowPaymentFallback] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
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
    setShowUpsell(true);
  };

  const handleSelectUpsell = (colors: [string, string]) => {
    setCheckoutData((prev) => ({ ...prev, quantity: 2, colors }));

    // Track AddToCart for 2-pack upsell
    trackAddToCart({
      content_name: 'NOCTE® Red Light Blocking Glasses - Pack x2',
      content_ids: ['nocte-red-glasses-2pack'],
      num_items: 2,
      value: 420000,
      currency: 'PYG',
    });

    setShowUpsell(false);
    setCheckoutInProgress(true); // Activate protection
    setShowStripeCheckout(true); // Show Stripe checkout
  };

  const handleSelectSingle = () => {
    setCheckoutData((prev) => ({ ...prev, quantity: 1 }));

    // Track AddToCart for single item
    trackAddToCart({
      content_name: 'NOCTE® Red Light Blocking Glasses',
      content_ids: ['nocte-red-glasses'],
      num_items: 1,
      value: 280000,
      currency: 'PYG',
    });

    setShowUpsell(false);
    setCheckoutInProgress(true); // Activate protection
    setShowStripeCheckout(true); // Show Stripe checkout
  };

  const handlePaymentSuccess = () => {
    setShowStripeCheckout(false);
    setShowLocation(true); // Show location modal after successful payment
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

  const handlePayOnDelivery = () => {
    setCheckoutData((prev) => ({ ...prev, paymentMethod: "cash" }));
    setShowPaymentFallback(false);
    setShowLocation(true);
  };

  const handleRetryPayment = () => {
    setShowPaymentFallback(false);
    // TODO: Re-trigger Stripe checkout
    setTimeout(() => {
      setShowLocation(true);
    }, 2000);
  };

  const handleLocationSubmit = (location: { city: string; address: string; lat?: number; long?: number }) => {
    setCheckoutData((prev) => ({
      ...prev,
      location: location.city,
      address: location.address || prev.address,
      lat: location.lat,
      long: location.long,
    }));
    setShowLocation(false);
    setShowPhoneForm(true);
  };

  const handleLocationClose = () => {
    setShowLocation(false);
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

  const handlePhoneSubmit = async (data: { name: string; phone: string; address?: string }) => {
    // Update checkout data
    const updatedCheckoutData = {
      ...checkoutData,
      name: data.name,
      phone: data.phone,
      address: data.address || "",
    };

    setCheckoutData(updatedCheckoutData);
    setShowPhoneForm(false);

    const totalAmount = checkoutData.quantity === 2 ? 420000 : 280000;

    // Send order to n8n webhook
    try {
      console.log('📦 Preparing to send order to n8n...');

      const orderData = {
        name: data.name,
        phone: data.phone,
        location: checkoutData.location,
        address: data.address || checkoutData.address,
        lat: checkoutData.lat,
        long: checkoutData.long,
        quantity: checkoutData.quantity,
        total: totalAmount,
        orderNumber: checkoutData.orderNumber,
        paymentIntentId: checkoutData.paymentIntentId || undefined,
        email: undefined, // We don't collect email in the flow
        paymentType: 'Cash' as const,
        deliveryType: 'común' as const,
      };

      // Send to n8n via backend
      const result = await sendOrderToN8N(orderData);

      if (!result.success) {
        console.error('❌ Failed to send order to n8n:', result.error);
        // Still show success page to user (they completed checkout)
        // But log the error for debugging
      } else {
        console.log('✅ Order sent to n8n successfully:', result);
      }
    } catch (error) {
      console.error('❌ Error sending order to n8n:', error);
      // Still show success page to user
    }

    // Track Purchase conversion event (CRITICAL for ROAS)
    trackPurchase({
      value: totalAmount,
      currency: 'PYG',
      content_name: checkoutData.quantity === 2
        ? 'NOCTE® Red Light Blocking Glasses - Pack x2'
        : 'NOCTE® Red Light Blocking Glasses',
      content_ids: checkoutData.quantity === 2
        ? ['nocte-red-glasses-2pack']
        : ['nocte-red-glasses'],
      num_items: checkoutData.quantity,
      order_id: checkoutData.orderNumber,
    });

    setShowSuccess(true);
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

  const orderData = useMemo(() => ({
    orderNumber: checkoutData.orderNumber,
    products: `${checkoutData.quantity}x NOCTE® Red Light Blocking Glasses`,
    total: checkoutData.quantity === 2 ? "420,000 Gs" : "280,000 Gs",
    location: checkoutData.location,
    phone: checkoutData.phone,
    name: checkoutData.name,
  }), [checkoutData]);

  return (
    <div className="min-h-screen bg-black text-foreground">
      {/* Header */}
      <header className="fixed top-0 w-full bg-black/60 backdrop-blur-xl border-b border-border/30 z-50">
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
      <main className="pt-16 md:pt-20">
        <HeroSection onBuyClick={handleBuyClick} />
        <ProductGallery />
        <ScienceSection />
        <BenefitsSection />
        <LifestyleSection />
        <ComparisonTable />
        <TestimonialsSection />
        <FAQSection />
        <GuaranteeSection onBuyClick={handleBuyClick} />
      </main>

      {/* Sticky Buy Button */}
      <StickyBuyButton onBuyClick={handleBuyClick} />

      {/* Checkout Modals */}
      <UpsellModal
        isOpen={showUpsell}
        onClose={() => setShowUpsell(false)}
        onSelectUpsell={handleSelectUpsell}
        onSelectSingle={handleSelectSingle}
      />

      <StripeCheckoutModal
        isOpen={showStripeCheckout}
        onClose={handleStripeCheckoutClose}
        onSuccess={handlePaymentSuccess}
        amount={checkoutData.quantity === 2 ? 420000 : 280000}
        currency="pyg"
      />

      <PaymentFallbackModal
        isOpen={showPaymentFallback}
        onPayOnDelivery={handlePayOnDelivery}
        onRetryPayment={handleRetryPayment}
        onCancel={() => setShowPaymentFallback(false)}
      />

      <LocationModal
        isOpen={showLocation}
        onLocationSubmit={handleLocationSubmit}
        onClose={handleLocationClose}
      />

      <PhoneNameForm
        isOpen={showPhoneForm}
        onSubmit={handlePhoneSubmit}
        onClose={handlePhoneFormClose}
      />

      <SuccessPage
        isOpen={showSuccess}
        orderData={orderData}
        onClose={handleSuccessClose}
      />

      {/* Footer */}
      <footer className="bg-black border-t border-border/30 py-12 md:py-16 px-4 md:px-6">
        <div className="container max-w-[1400px] mx-auto text-center space-y-5 md:space-y-6">
          <p className="text-2xl font-bold tracking-tighter opacity-70">NOCTE<sup className="text-[0.5em] ml-0.5">®</sup></p>
          <p className="text-muted-foreground font-light text-xs md:text-sm">
            Úsalos antes de dormir. Duerme profundo.
          </p>

          {/* Payment Methods - Powered by Stripe */}
          <div className="flex flex-col items-center justify-center gap-3 pt-2">
            <div className="flex items-center gap-2">
              <img
                src="https://cdn.brandfolder.io/KGT2DTA4/at/8vbr8k4mr5xjwk4hxq4t9vs/Stripe_wordmark_-_blurple.svg"
                alt="Powered by Stripe"
                className="h-5 opacity-60"
              />
            </div>
            <p className="text-[10px] text-muted-foreground/50">
              Aceptamos Visa, Mastercard, American Express y más
            </p>
          </div>

          <p className="text-[10px] md:text-xs text-muted-foreground/60 font-light">
            © 2025 NOCTE® Todos los Derechos Reservados
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
