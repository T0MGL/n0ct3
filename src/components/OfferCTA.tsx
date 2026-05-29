import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { fadeInUpView } from "@/lib/animations";

interface OfferCTAProps {
  onBuyClick: () => void;
  variant?: "default" | "minimal";
  selectedPrice: number;
}

export const OfferCTA = ({ onBuyClick, variant = "default", selectedPrice }: OfferCTAProps) => {
  const ctaShadow = "0 0 50px hsl(var(--variant-active) / 0.4)";
  const sectionBg =
    "linear-gradient(180deg, #000000, hsl(var(--variant-active) / 0.05), #000000)";

  if (variant === "minimal") {
    return (
      <motion.section
        {...fadeInUpView}
        className="py-6 md:py-8 px-4 md:px-6 transition-[background] duration-500"
        style={{ background: sectionBg }}
      >
        <div className="container max-w-[800px] mx-auto text-center">
          <Button
            variant="hero"
            size="xl"
            className="w-full md:w-auto md:min-w-[320px] text-base md:text-lg h-14 md:h-16 transition-shadow duration-500"
            style={{ boxShadow: ctaShadow }}
            onClick={onBuyClick}
          >
            Aprovechar Oferta. Gs. {selectedPrice.toLocaleString('es-PY')}
          </Button>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      {...fadeInUpView}
      className="py-12 md:py-16 px-4 md:px-6 transition-[background] duration-500"
      style={{ background: sectionBg }}
    >
      <div className="container max-w-[800px] mx-auto text-center">
        <Button
          variant="hero"
          size="xl"
          className="w-full md:w-auto md:min-w-[320px] text-base md:text-lg h-14 md:h-16 transition-shadow duration-500"
          style={{ boxShadow: ctaShadow }}
          onClick={onBuyClick}
        >
          Aprovechar Oferta. Gs. {selectedPrice.toLocaleString('es-PY')}
        </Button>
      </div>
    </motion.section>
  );
};

export default OfferCTA;
