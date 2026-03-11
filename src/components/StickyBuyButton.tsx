import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useEffect, useState, useMemo, useRef } from "react";
import { ShieldCheckIcon, TruckIcon } from "@heroicons/react/24/outline";
import { getDeliveryDates } from "@/lib/delivery-utils";

interface StickyBuyButtonProps {
  onBuyClick: () => void;
  selectedPrice: number;
}

export const StickyBuyButton = ({ onBuyClick, selectedPrice }: StickyBuyButtonProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const deliveryDates = useMemo(() => getDeliveryDates(), []);

  // Use refs to cache DOM element references
  const heroButtonRef = useRef<Element | null>(null);
  const guaranteeButtonRef = useRef<Element | null>(null);

  // Cache DOM references on mount and after lazy-loaded sections render
  useEffect(() => {
    const cacheRefs = () => {
      heroButtonRef.current = document.querySelector('[data-hero-cta]');
      guaranteeButtonRef.current = document.querySelector('[data-guarantee-cta]');
    };

    // Try immediately and retry once after lazy sections load
    cacheRefs();
    const retryTimer = setTimeout(cacheRefs, 3000);

    return () => clearTimeout(retryTimer);
  }, []);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      // Retry caching if hero button not found yet (lazy load)
      if (!heroButtonRef.current) {
        heroButtonRef.current = document.querySelector('[data-hero-cta]');
        guaranteeButtonRef.current = document.querySelector('[data-guarantee-cta]');
        if (!heroButtonRef.current) return;
      }

      const heroRect = heroButtonRef.current.getBoundingClientRect();
      const heroOutOfView = heroRect.bottom < 0 || heroRect.top > window.innerHeight;

      const hasScrolledDown = window.scrollY > 300;

      let guaranteeInView = false;
      if (guaranteeButtonRef.current) {
        const guaranteeRect = guaranteeButtonRef.current.getBoundingClientRect();
        guaranteeInView = guaranteeRect.top < window.innerHeight && guaranteeRect.bottom > 0;
      }

      setIsVisible(hasScrolledDown && heroOutOfView && !guaranteeInView);
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{
        y: isVisible ? 0 : 100,
        opacity: isVisible ? 1 : 0
      }}
      transition={{
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94] // easeOutQuad for smooth feel
      }}
      className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none"
    >
      <div className="w-full px-4 md:px-6 pb-4 md:pb-6">
        <div className="bg-black/95 backdrop-blur-xl border-t border-border/30 p-4 md:p-5 shadow-[0_-4px_20px_rgba(0,0,0,0.4)] pointer-events-auto">
          <div className="flex flex-col gap-4">
            {/* Precio y detalles */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">
                  <span className="text-xl md:text-2xl font-bold text-white">Gs. {selectedPrice.toLocaleString('es-PY')}</span>
                </p>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                  <TruckIcon className="w-4 h-4 text-gold/90" />
                  <p className="text-xs text-gold/90 font-medium">
                    📦 Pedí hoy y recibí entre el {deliveryDates.startDay} y {deliveryDates.endDay}
                  </p>
                </div>
              </div>

              {/* Sellos de credibilidad */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <ShieldCheckIcon className="w-5 h-5 text-gold" />
                  <span className="whitespace-nowrap">Garantía 30 días</span>
                </div>
              </div>
            </div>

            {/* Botón de compra - Only animate when visible */}
            <motion.div
              animate={isVisible ? {
                scale: [1, 1.02, 1],
              } : { scale: 1 }}
              transition={isVisible ? {
                duration: 2,
                repeat: Infinity,
                repeatType: "loop",
                ease: "easeInOut"
              } : { duration: 0 }}
            >
              <Button
                variant="hero"
                size="lg"
                className="w-full h-12 md:h-14 text-sm md:text-base font-bold"
                onClick={onBuyClick}
              >
                Comprar Ahora - Gs. {selectedPrice.toLocaleString('es-PY')}
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
