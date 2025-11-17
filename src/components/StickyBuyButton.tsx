import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import { ShieldCheckIcon, TruckIcon } from "@heroicons/react/24/outline";

interface StickyBuyButtonProps {
  onBuyClick: () => void;
}

export const StickyBuyButton = ({ onBuyClick }: StickyBuyButtonProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const { scrollY } = useScroll();

  useEffect(() => {
    const heroButton = document.querySelector('[data-hero-cta]');
    const guaranteeButton = document.querySelector('[data-guarantee-cta]');

    const handleScroll = () => {
      if (!heroButton) return;

      const heroRect = heroButton.getBoundingClientRect();
      const heroOutOfView = heroRect.bottom < 0 || heroRect.top > window.innerHeight;

      // Check if guarantee button is visible
      let guaranteeInView = false;
      if (guaranteeButton) {
        const guaranteeRect = guaranteeButton.getBoundingClientRect();
        guaranteeInView = guaranteeRect.top < window.innerHeight && guaranteeRect.bottom > 0;
      }

      // Show sticky button only when hero button is out of view AND guarantee button is not visible
      setIsVisible(heroOutOfView && !guaranteeInView);
    };

    handleScroll(); // Check initial state
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
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
      <div className="container max-w-[1400px] mx-auto px-4 md:px-6 lg:px-12 pb-6 md:pb-8">
        <div className="bg-black/90 backdrop-blur-xl border border-border/30 rounded-lg p-4 md:p-5 shadow-[0_-4px_20px_rgba(0,0,0,0.4)] pointer-events-auto">
          <div className="flex flex-col gap-4">
            {/* Precio y detalles */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">
                  <span className="line-through text-foreground/40">320,000 Gs</span>
                  {" "}
                  <span className="text-xl md:text-2xl font-bold text-primary ml-2">279,000 Gs</span>
                </p>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                  <TruckIcon className="w-4 h-4 text-gold/90" />
                  <p className="text-xs text-gold/90 font-medium">
                    Pedí hoy y recibí como máximo en 48 horas
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

            {/* Botón de compra */}
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 30px rgba(239, 68, 68, 0.3)",
                  "0 0 40px rgba(239, 68, 68, 0.5)",
                  "0 0 30px rgba(239, 68, 68, 0.3)",
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="rounded-lg"
            >
              <Button
                variant="hero"
                size="lg"
                className="w-full h-12 md:h-14 text-sm md:text-base font-bold"
                onClick={onBuyClick}
              >
                Comprar Ahora
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
