import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CountdownTimer } from "@/components/CountdownTimer";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import { motion } from "framer-motion";
import heroImage from "@/assets/nocte-product-hero.jpg";
import { StripePaymentButton } from "@/components/StripePaymentButton";
import { PaymentSuccessModal } from "@/components/PaymentSuccessModal";
import { trackViewContent } from "@/lib/meta-pixel";

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

  // Track ViewContent when hero section is viewed
  useEffect(() => {
    trackViewContent();
  }, []);
  return (
    <section className="relative min-h-[90vh] md:min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.08),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-black pointer-events-none" />

      <div className="container max-w-[1400px] mx-auto px-4 md:px-6 lg:px-12 relative z-10 py-16 md:py-32">
        {/* Mobile-First Layout */}
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 md:gap-16 lg:gap-24 items-center">
          {/* Text Content - Order 2 on mobile, Order 1 on desktop */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="space-y-6 md:space-y-10 text-center lg:text-left order-2 lg:order-1 w-full"
          >
            <div className="space-y-4 md:space-y-6">
              <div className="inline-block">
                <h1 className="text-[3.5rem] md:text-[6rem] lg:text-[7rem] font-bold tracking-tighter leading-[0.85]">
                  NOCTE<sup className="text-[0.3em] ml-1">®</sup>
                </h1>
                <div className="h-[2px] md:h-[3px] w-full bg-gradient-to-r from-primary to-transparent mt-2" />
              </div>

              <h2 className="text-xl md:text-3xl lg:text-4xl font-light tracking-tight text-foreground/80">
                Lentes rojos. Sueño profundo.
              </h2>
            </div>

            <p className="text-base md:text-lg lg:text-xl text-foreground/70 leading-relaxed max-w-xl mx-auto lg:mx-0 font-light px-4 md:px-0">
              Úsalos mientras trabajas de noche. Duerme profundo después. Bloqueamos el 99% de luz azul para emprendedores que viven en pantallas.
            </p>

            <div className="space-y-6 pt-2 md:pt-4">
              {/* Star Rating */}
              <div className="flex flex-col items-center lg:items-start gap-3">
                <div className="flex items-center gap-1">
                  <StarIcon className="w-5 h-5 md:w-6 md:h-6 text-accent" />
                  <StarIcon className="w-5 h-5 md:w-6 md:h-6 text-accent" />
                  <StarIcon className="w-5 h-5 md:w-6 md:h-6 text-accent" />
                  <StarIcon className="w-5 h-5 md:w-6 md:h-6 text-accent" />
                  <div className="relative w-5 h-5 md:w-6 md:h-6">
                    <StarIcon className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground/30 absolute" />
                    <div className="overflow-hidden absolute inset-0" style={{ width: '70%' }}>
                      <StarIcon className="w-5 h-5 md:w-6 md:h-6 text-accent" />
                    </div>
                  </div>
                </div>
                <p className="text-sm md:text-base text-muted-foreground font-light">
                  <span className="font-semibold text-foreground">4.7 de 5</span> por 1,174 clientes satisfechos
                </p>
              </div>

              {useStripe ? (
                <StripePaymentButton
                  onSuccess={() => setShowStripeSuccess(true)}
                  onError={(error) => {
                    setStripeError(error);
                    // Fallback to regular checkout flow if Stripe fails
                    onBuyClick();
                  }}
                  className="w-full md:w-auto md:min-w-[280px]"
                >
                  Comprar Ahora
                </StripePaymentButton>
              ) : (
                <Button
                  data-hero-cta
                  variant="hero"
                  size="xl"
                  className="w-full md:w-auto md:min-w-[280px] shadow-[0_0_50px_rgba(239,68,68,0.4)] text-base md:text-lg h-14 md:h-16"
                  onClick={onBuyClick}
                >
                  Comprar Ahora
                </Button>
              )}

              <div className="space-y-3 md:space-y-4">
                <div className="flex flex-col items-center lg:items-start gap-2">
                  <p className="text-sm md:text-base text-foreground/60">
                    <span className="line-through text-foreground/40">320,000 Gs</span>
                    {" "}
                    <span className="text-2xl md:text-3xl font-bold text-primary ml-2">279,000 Gs</span>
                  </p>
                  <div className="flex items-center gap-2 text-xs md:text-sm text-primary/80 font-medium">
                    <ExclamationTriangleIcon className="w-4 h-4" />
                    <span>Solo quedan 17 unidades</span>
                  </div>
                </div>

                {/* Countdown Timer */}
                <div className="flex justify-center lg:justify-start">
                  <CountdownTimer />
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Image - Order 1 on mobile (shows first), Order 2 on desktop */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative order-1 lg:order-2 w-full"
          >
            <div className="absolute inset-0 bg-primary/10 rounded-full blur-[100px] md:blur-[120px] scale-75" />
            <div className="relative px-4 md:px-0">
              <img
                src={heroImage}
                alt="NOCTE - Lentes rojos anti-luz azul premium"
                className="relative w-full h-auto drop-shadow-[0_8px_16px_rgba(239,68,68,0.25)] max-w-[500px] md:max-w-full mx-auto"
              />
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
