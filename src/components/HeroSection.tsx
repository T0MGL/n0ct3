import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CountdownTimer } from "@/components/CountdownTimer";
import {
  MoonIcon,
  ShieldCheckIcon,
  BoltIcon,
  TruckIcon
} from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import { motion } from "framer-motion";
import heroImage from "@/assets/nocte-hero-lifestyle.webp";
import productImage from "@/assets/nocte-product-hero.jpg";
import caseImage from "@/assets/nocte-case.jpg";
import tarjetasImage from "@/assets/tarjetas.webp";
import { StripePaymentButton } from "@/components/StripePaymentButton";
import { PaymentSuccessModal } from "@/components/PaymentSuccessModal";
import { trackViewContent } from "@/lib/meta-pixel";
import { getDeliveryDates } from "@/lib/delivery-utils";

interface HeroSectionProps {
  onBuyClick: () => void;
}

export const HeroSection = ({ onBuyClick }: HeroSectionProps) => {
  const [showStripeSuccess, setShowStripeSuccess] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [useStripe] = useState(() => {
    // Only enable Stripe if API key is configured
    return !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  });
  const [currentSlide, setCurrentSlide] = useState(0);
  const deliveryDates = getDeliveryDates();

  const slides = [
    { image: heroImage, alt: "Persona usando lentes NOCTE" },
    { image: productImage, alt: "Lentes NOCTE - Vista detallada" },
    { image: caseImage, alt: "NOCTE Packaging Premium" }
  ];

  // Track ViewContent when hero section is viewed
  useEffect(() => {
    trackViewContent();
  }, []);
  return (
    <section className="relative min-h-[85vh] flex items-start overflow-hidden bg-black">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.08),transparent_70%)] pointer-events-none" />

      <div className="container max-w-[1400px] mx-auto px-4 md:px-6 lg:px-12 relative z-10 pt-[80px] md:pt-4 pb-6 md:pb-12">
        {/* Mobile-First Layout */}
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 md:gap-8 items-start">

          {/* Image Slider - Order 1 on mobile (shows first) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative order-1 w-full"
          >
            {/* Authority Badge */}
            <div className="absolute top-4 left-2 md:top-2 md:left-4 z-20 bg-gradient-to-r from-primary to-red-600 px-3 py-1.5 rounded-md shadow-lg">
              <p className="text-white text-xs md:text-sm font-semibold">
                #1 Lentes Anti-Luz Azul en Paraguay 🇵🇾
              </p>
            </div>

            {/* Image Carousel with scroll-snap */}
            <div className="relative w-full max-w-[500px] mx-auto">
              <div
                className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide rounded-lg"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                onScroll={(e) => {
                  const scrollLeft = e.currentTarget.scrollLeft;
                  const slideWidth = e.currentTarget.offsetWidth;
                  const newSlide = Math.round(scrollLeft / slideWidth);
                  setCurrentSlide(newSlide);
                }}
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
                      const container = document.querySelector('.snap-x');
                      if (container) {
                        container.scrollTo({
                          left: index * container.clientWidth,
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
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
                  <MoonIcon className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm md:text-base font-medium text-white">Duerme Profundo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <ShieldCheckIcon className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm md:text-base font-medium text-white">Bloquea Luz Azul</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <BoltIcon className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm md:text-base font-medium text-white">Cero Fatiga Visual</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <TruckIcon className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm md:text-base font-medium text-white">Envío Rápido</span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3 py-2">
              <span className="text-base text-foreground/40 line-through">Gs. 239.000</span>
              <span className="text-4xl md:text-5xl font-bold text-white">Gs. 199.000</span>
            </div>

            {/* CTA Button */}
            <div className="space-y-3">
              {useStripe ? (
                <StripePaymentButton
                  onSuccess={() => setShowStripeSuccess(true)}
                  onError={(error) => {
                    setStripeError(error);
                    onBuyClick();
                  }}
                  className="w-full h-14 md:h-16 text-base md:text-lg font-bold shadow-[0_8px_24px_rgba(239,68,68,0.4)]"
                >
                  COMPRAR AHORA - Gs. 199.000
                </StripePaymentButton>
              ) : (
                <Button
                  data-hero-cta
                  variant="hero"
                  size="xl"
                  className="w-full h-14 md:h-16 text-base md:text-lg font-bold shadow-[0_8px_24px_rgba(239,68,68,0.4)]"
                  onClick={onBuyClick}
                >
                  COMPRAR AHORA - Gs. 199.000
                </Button>
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
    </section>
  );
};
