import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CountdownTimer } from "@/components/CountdownTimer";
import {
  MoonIcon,
  ShieldCheckIcon,
  ComputerDesktopIcon,
  FaceSmileIcon
} from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import heroImage from "@/assets/nocte-hero-lifestyle.webp";
import productImage from "@/assets/nocte-product.jpg";
import caseImage from "@/assets/nocte-case.webp";
import nocteProductImage from "@/assets/nocteproduct.webp";
import tarjetasImage from "@/assets/tarjetas.webp";
import { StripePaymentButton } from "@/components/StripePaymentButton";
import { PaymentSuccessModal } from "@/components/PaymentSuccessModal";
import { LivePurchaseNotification, getRandomBuyer } from "@/components/LivePurchaseNotification";
import { trackViewContent } from "@/lib/meta-pixel";
import { getDeliveryDates } from "@/lib/delivery-utils";

interface HeroSectionProps {
  onBuyClick: () => void;
}

export const HeroSection = ({ onBuyClick }: HeroSectionProps) => {
  const [showStripeSuccess, setShowStripeSuccess] = useState(false);
  const [useStripe] = useState(() => {
    // Only enable Stripe if API key is configured
    return !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  });
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [hasPeeked, setHasPeeked] = useState(false);

  // Live purchase notification
  const [showPurchaseNotification, setShowPurchaseNotification] = useState(false);
  const [currentBuyer, setCurrentBuyer] = useState(() => getRandomBuyer());
  const hasShownPurchaseRef = useRef(false);

  // Memoize delivery dates calculation (doesn't change during session)
  const deliveryDates = useMemo(() => getDeliveryDates(), []);

  // Dynamic stock counter (resets daily, creates urgency)
  const [stockLeft, setStockLeft] = useState(() => {
    const today = new Date().toDateString();
    const stored = localStorage.getItem('nocte-stock-data');

    if (stored) {
      const data = JSON.parse(stored);
      if (data.date === today) {
        return data.stock;
      }
    }

    // Static stock of 17 units
    const newStock = 17;
    localStorage.setItem('nocte-stock-data', JSON.stringify({ date: today, stock: newStock }));
    return newStock;
  });

  // Animated stock number display
  const [displayStock, setDisplayStock] = useState(stockLeft);
  const [stockAnimating, setStockAnimating] = useState(false);

  const slides = [
    { image: heroImage, alt: "Persona usando lentes NOCTE" },
    { image: productImage, alt: "Lentes NOCTE - Vista detallada" },
    { image: caseImage, alt: "NOCTE Packaging Premium" },
    { image: nocteProductImage, alt: "NOCTE Producto Premium" }
  ];

  // Track ViewContent when hero section is viewed
  useEffect(() => {
    trackViewContent();

    // Preload checkout modals after a short delay (for mobile users)
    // This ensures instant response when user clicks CTA
    const preloadTimer = setTimeout(() => {
      import("@/components/checkout/QuantitySelector");
      import("@/components/checkout/PhoneNameForm");
      import("@/components/checkout/StripeCheckoutModal");
    }, 2000); // Wait 2 seconds after page load

    return () => clearTimeout(preloadTimer);
  }, []);

  // Carousel peek animation - hints that carousel is scrollable
  useEffect(() => {
    if (hasPeeked || hasInteracted || currentSlide !== 0) return;

    const peekTimer = setTimeout(() => {
      if (!carouselRef.current || hasInteracted) return;

      const carousel = carouselRef.current;

      // Temporarily disable scroll-snap for smooth peek animation
      carousel.style.scrollSnapType = 'none';
      // Move further (120px) to make peek more noticeable
      carousel.scrollTo({ left: 120, behavior: 'smooth' });

      // Hold the peek position longer (1 second) before returning
      setTimeout(() => {
        if (carousel && !hasInteracted) {
          carousel.scrollTo({ left: 0, behavior: 'smooth' });

          // Re-enable scroll-snap after animation completes
          setTimeout(() => {
            if (carousel) {
              carousel.style.scrollSnapType = 'x mandatory';
            }
          }, 500);
        }
      }, 1000);

      setHasPeeked(true);
    }, 2000);

    return () => clearTimeout(peekTimer);
  }, [hasPeeked, hasInteracted, currentSlide]);

  // Live purchase notification - shows once per session after 8 seconds
  useEffect(() => {
    if (hasShownPurchaseRef.current) return;

    const purchaseTimer = setTimeout(() => {
      if (hasShownPurchaseRef.current) return;
      hasShownPurchaseRef.current = true;

      setCurrentBuyer(getRandomBuyer());
      setShowPurchaseNotification(true);

      // Animate stock decrease after notification appears
      setTimeout(() => {
        const newStock = Math.max(stockLeft - 1, 1);

        // Trigger pulse animation on stock indicator
        setStockAnimating(true);

        // Update the display number with dramatic effect
        setTimeout(() => {
          setDisplayStock(newStock);
          setStockLeft(newStock);

          // Update localStorage
          const today = new Date().toDateString();
          localStorage.setItem('nocte-stock-data', JSON.stringify({ date: today, stock: newStock }));

          // Stop animation after a bit
          setTimeout(() => setStockAnimating(false), 1500);
        }, 300);
      }, 1500);

      setTimeout(() => setShowPurchaseNotification(false), 4000);
    }, 8000);

    return () => clearTimeout(purchaseTimer);
  }, [stockLeft]);

  return (
    <section className="relative min-h-[85vh] flex items-start overflow-hidden bg-black">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.08),transparent_70%)] pointer-events-none" />

      <div className="container max-w-[1400px] mx-auto px-4 md:px-6 lg:px-12 relative z-10 pt-[80px] md:pt-36 pb-6 md:pb-12">
        {/* Mobile-First Layout */}
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 md:gap-8 items-start">

          {/* Image Slider - Order 1 on mobile (shows first) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative order-1 w-full"
          >
            {/* Authority Badge */}
            <motion.div
              layout
              className="absolute top-4 left-2 md:top-2 md:left-4 z-20 bg-gradient-to-r from-primary to-red-600 px-3 py-1.5 rounded-md shadow-lg overflow-hidden"
              initial={false}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <AnimatePresence mode="wait" initial={false}>
                {currentSlide === 0 ? (
                  <motion.p
                    key="full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-white text-xs md:text-sm font-semibold whitespace-nowrap"
                  >
                    #1 Lentes Anti-Luz Azul en Paraguay 🇵🇾
                  </motion.p>
                ) : (
                  <motion.p
                    key="short"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-white text-xs md:text-sm font-semibold whitespace-nowrap"
                  >
                    #1 🇵🇾
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Image Carousel with scroll-snap */}
            <div className="relative w-full max-w-[500px] mx-auto">
              <div
                ref={carouselRef}
                className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide rounded-lg"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                onScroll={(e) => {
                  const scrollLeft = e.currentTarget.scrollLeft;
                  const slideWidth = e.currentTarget.offsetWidth;
                  const newSlide = Math.round(scrollLeft / slideWidth);
                  setCurrentSlide(newSlide);
                }}
                onTouchStart={() => setHasInteracted(true)}
                onMouseDown={() => setHasInteracted(true)}
              >
                {slides.map((slide, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 w-full snap-center"
                  >
                    <div className="relative w-full aspect-square overflow-hidden rounded-lg">
                      <img
                        src={slide.image}
                        alt={slide.alt}
                        loading={index === 0 ? "eager" : "lazy"}
                        fetchPriority={index === 0 ? "high" : "auto"}
                        className="w-full h-full object-cover drop-shadow-[0_8px_16px_rgba(239,68,68,0.25)]"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Carousel Indicators */}
              <div className="flex justify-center gap-2 mt-4">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (carouselRef.current) {
                        carouselRef.current.scrollTo({
                          left: index * carouselRef.current.clientWidth,
                          behavior: 'smooth'
                        });
                      }
                    }}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${currentSlide === index
                      ? 'bg-primary w-6'
                      : 'bg-white/30'
                      }`}
                    aria-label={`Ir a imagen ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Content - Order 2 on mobile */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
            className="space-y-4 md:space-y-6 order-2 w-full"
          >
            {/* Main Title */}
            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
                Lentes Rojos Premium Anti-Luz Azul
              </h1>

              {/* Star Rating + Social Proof */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-0.5">
                  <StarIcon className="w-5 h-5 text-accent" />
                  <StarIcon className="w-5 h-5 text-accent" />
                  <StarIcon className="w-5 h-5 text-accent" />
                  <StarIcon className="w-5 h-5 text-accent" />
                  <div className="relative w-5 h-5">
                    <StarIcon className="w-5 h-5 text-muted-foreground/30 absolute" />
                    <div className="overflow-hidden absolute inset-0" style={{ width: '80%' }}>
                      <StarIcon className="w-5 h-5 text-accent" />
                    </div>
                  </div>
                </div>
                <p className="text-sm text-foreground/80 font-medium">
                  4.8/5 (1.174 Clientes en Paraguay)
                </p>
              </div>
            </div>

            {/* Benefits Grid - 2x2 Icons */}
            <div className="grid grid-cols-2 gap-3 md:gap-4 py-2">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <ComputerDesktopIcon className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm md:text-base font-medium text-white">Trabaja en Pantallas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <ShieldCheckIcon className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm md:text-base font-medium text-white">Bloquea Luz Azul</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FaceSmileIcon className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm md:text-base font-medium text-white">Cero Migrañas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MoonIcon className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm md:text-base font-medium text-white">Dormí Profundo</span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3 py-2">
              <span className="text-base text-foreground/40 line-through">Gs. 239.000</span>
              <span className="text-4xl md:text-5xl font-bold text-white">Gs. 199.000</span>
            </div>

            {/* Stock Urgency Indicator */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{
                opacity: 1,
                scale: stockAnimating ? [1, 1.08, 1] : 1,
                borderColor: stockAnimating ? ['rgba(239,68,68,0.3)', 'rgba(239,68,68,0.8)', 'rgba(239,68,68,0.3)'] : 'rgba(239,68,68,0.3)',
              }}
              transition={{
                delay: stockAnimating ? 0 : 0.3,
                duration: stockAnimating ? 0.6 : 0.4,
                repeat: stockAnimating ? 2 : 0,
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-lg transition-all ${stockAnimating ? 'shadow-[0_0_20px_rgba(239,68,68,0.5)]' : ''}`}
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
              </span>
              <span className="text-sm font-semibold text-primary">
                Solo quedan{" "}
                <AnimatePresence mode="wait">
                  <motion.span
                    key={displayStock}
                    initial={{ opacity: 0, y: -20, scale: 1.5 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.5 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className={`inline-block font-bold ${stockAnimating ? 'text-white' : ''}`}
                  >
                    {displayStock}
                  </motion.span>
                </AnimatePresence>
                {" "}unidades en stock
              </span>
            </motion.div>

            {/* CTA Button */}
            <div className="space-y-3">
              {useStripe ? (
                <motion.div
                  animate={{
                    scale: [1, 1.02, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "loop",
                    ease: "easeInOut"
                  }}
                >
                  <StripePaymentButton
                    onSuccess={() => setShowStripeSuccess(true)}
                    onError={(error) => {
                      console.error('Stripe error:', error);
                      onBuyClick();
                    }}
                    className="w-full h-14 md:h-16 text-base md:text-lg font-bold shadow-[0_8px_24px_rgba(239,68,68,0.4)]"
                  >
                    COMPRAR AHORA - Gs. 199.000
                  </StripePaymentButton>
                </motion.div>
              ) : (
                <motion.div
                  animate={{
                    scale: [1, 1.02, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "loop",
                    ease: "easeInOut"
                  }}
                >
                  <Button
                    data-hero-cta
                    variant="hero"
                    size="xl"
                    className="w-full h-14 md:h-16 text-base md:text-lg font-bold shadow-[0_8px_24px_rgba(239,68,68,0.4)]"
                    onClick={onBuyClick}
                  >
                    COMPRAR AHORA - Gs. 199.000
                  </Button>
                </motion.div>
              )}

              {/* Dynamic Delivery Date */}
              <p className="text-sm text-center text-accent font-medium">
                📦 Pedí hoy y recibí entre el {deliveryDates.startDay} y {deliveryDates.endDay}
              </p>
            </div>

            {/* Payment Methods */}
            <div className="flex justify-center pt-2">
              <img
                src={tarjetasImage}
                alt="Visa, Mastercard, Apple Pay, Google Pay"
                className="h-8 md:h-9 w-auto opacity-80"
              />
            </div>

            {/* Countdown Timer */}
            <div className="flex justify-center pt-2">
              <CountdownTimer />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stripe Payment Success Modal */}
      <PaymentSuccessModal
        open={showStripeSuccess}
        onClose={() => setShowStripeSuccess(false)}
      />

      {/* Live Purchase Notification */}
      <LivePurchaseNotification
        isVisible={showPurchaseNotification}
        buyerName={currentBuyer.name}
        buyerCity={currentBuyer.city}
      />
    </section>
  );
};
