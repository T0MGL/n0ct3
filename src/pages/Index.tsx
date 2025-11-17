import { useState, useEffect, useMemo } from "react";
import { DeliveryBanner } from "@/components/DeliveryBanner";
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
  // UI state
  const [isBannerVisible, setIsBannerVisible] = useState(true);

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
      value: 418500,
      currency: 'PYG',
    });

    setShowUpsell(false);
    setCheckoutInProgress(true); // Activate protection
    setShowLocation(true); // STEP 1: Get delivery location
  };

  const handleSelectSingle = () => {
    setCheckoutData((prev) => ({ ...prev, quantity: 1 }));

    // Track AddToCart for single item
    trackAddToCart({
      content_name: 'NOCTE® Red Light Blocking Glasses',
      content_ids: ['nocte-red-glasses'],
      num_items: 1,
      value: 279000,
      currency: 'PYG',
    });

    setShowUpsell(false);
    setCheckoutInProgress(true); // Activate protection
    setShowLocation(true); // STEP 1: Get delivery location
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    // STEP 4: Payment successful - now send order to n8n and show success
    setShowStripeCheckout(false);
    setCheckoutData((prev) => ({ ...prev, paymentIntentId }));

    const totalAmount = checkoutData.quantity === 2 ? 418500 : 279000;

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

  const handleBackToUpsell = () => {
    setShowStripeCheckout(false);
    setShowUpsell(true); // Go back to quantity selection
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

  const handlePayOnDeliveryFromCheckout = () => {
    setCheckoutData((prev) => ({ ...prev, paymentMethod: "cash" }));
    setShowStripeCheckout(false);
    setShowLocation(true); // Go directly to location modal
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

  const handlePhoneSubmit = (data: { name: string; phone: string; address?: string }) => {
    // STEP 2: Store personal info and proceed to payment
    setCheckoutData((prev) => ({
      ...prev,
      name: data.name,
      phone: data.phone,
      address: data.address || prev.address,
    }));

    setShowPhoneForm(false);
    setShowStripeCheckout(true); // STEP 3: Show payment with all info collected
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
    total: checkoutData.quantity === 2 ? "418,500 Gs" : "279,000 Gs",
    location: checkoutData.location,
    phone: checkoutData.phone,
    name: checkoutData.name,
  }), [checkoutData]);

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
        onBack={() => setShowPhoneForm(true)}
        onSuccess={handlePaymentSuccess}
        amount={checkoutData.quantity === 2 ? 418500 : 279000}
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

          <p className="text-[10px] md:text-xs text-muted-foreground/60 font-light">
            © 2025 NOCTE® Todos los Derechos Reservados
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
