import { Button } from "@/components/ui/button";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { fadeInUpView } from "@/lib/animations";

interface OfferCTAProps {
  onBuyClick: () => void;
  variant?: "default" | "minimal";
}

export const OfferCTA = ({ onBuyClick, variant = "default" }: OfferCTAProps) => {
  if (variant === "minimal") {
    return (
      <motion.section
        {...fadeInUpView}
        className="py-12 md:py-16 px-4 md:px-6 bg-gradient-to-b from-black via-primary/5 to-black"
      >
        <div className="container max-w-[800px] mx-auto text-center">
          <Button
            variant="hero"
            size="xl"
            className="w-full md:w-auto md:min-w-[320px] shadow-[0_0_50px_rgba(239,68,68,0.4)] text-base md:text-lg h-14 md:h-16"
            onClick={onBuyClick}
          >
            Aprovechar Oferta
          </Button>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      {...fadeInUpView}
      className="py-16 md:py-24 px-4 md:px-6 bg-gradient-to-b from-black via-primary/5 to-black relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.12),transparent_60%)]" />

      <div className="container max-w-[900px] mx-auto relative z-10">
        <div className="bg-gradient-to-b from-secondary/40 to-secondary/20 backdrop-blur-sm border border-primary/30 rounded-lg p-8 md:p-12 shadow-[0_8px_16px_rgba(239,68,68,0.15)]">
          <div className="text-center space-y-6 md:space-y-8">
            <div className="space-y-3 md:space-y-4">
              <h3 className="text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                279,000 Gs <span className="text-muted-foreground line-through text-lg md:text-2xl font-normal ml-2">320,000 Gs</span>
              </h3>
              <div className="flex items-center justify-center gap-2 text-sm md:text-base text-primary/90 font-medium">
                <ExclamationTriangleIcon className="w-5 h-5" />
                <span>Solo quedan 17 unidades a este precio</span>
              </div>
            </div>

            <Button
              variant="hero"
              size="xl"
              className="w-full md:w-auto md:min-w-[320px] shadow-[0_0_50px_rgba(239,68,68,0.5)] text-base md:text-lg h-14 md:h-16"
              onClick={onBuyClick}
            >
              Aprovechar Oferta
            </Button>

            <div className="pt-4 border-t border-border/30">
              <p className="text-xs md:text-sm text-muted-foreground font-light">
                ✓ Envío GRATIS · ✓ 30 días de garantía · ✓ Entrega en 1-2 días
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default OfferCTA;
