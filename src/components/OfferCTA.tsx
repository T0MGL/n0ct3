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
        className="py-6 md:py-8 px-4 md:px-6 bg-gradient-to-b from-black via-primary/5 to-black"
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
};

export default OfferCTA;
