import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { fadeInUpView } from "@/lib/animations";
import { ALL_VARIANTS_SOLD_OUT } from "@/lib/variants";

interface OfferCTAProps {
  onBuyClick: () => void;
  variant?: "default" | "minimal";
  selectedPrice: number;
  /**
   * Linea que va arriba del boton. Cada CTA de la pagina cae despues de una
   * objecion distinta, asi que repetir el mismo boton tres veces desperdicia
   * el unico momento en que el cliente ya tiene la duda resuelta y fresca.
   */
  headline?: string;
  /** Texto del boton. Por defecto, la oferta con el precio. */
  label?: string;
}

export const OfferCTA = ({
  onBuyClick,
  variant = "default",
  selectedPrice,
  headline,
  label,
}: OfferCTAProps) => {
  const ctaShadow = ALL_VARIANTS_SOLD_OUT ? undefined : "0 0 50px hsl(var(--variant-active) / 0.4)";
  const sectionBg =
    "linear-gradient(180deg, #000000, hsl(var(--variant-active) / 0.05), #000000)";
  const ctaLabel = ALL_VARIANTS_SOLD_OUT
    ? "Agotado. Reponemos pronto"
    : label ?? `Aprovechar Oferta. Gs. ${selectedPrice.toLocaleString('es-PY')}`;

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
            disabled={ALL_VARIANTS_SOLD_OUT}
            className="w-full md:w-auto md:min-w-[320px] text-base md:text-lg h-14 md:h-16 transition-shadow duration-500"
            style={{ boxShadow: ctaShadow }}
            onClick={onBuyClick}
          >
            {ctaLabel}
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
      <div className="container mx-auto max-w-[800px] text-center">
        {headline && !ALL_VARIANTS_SOLD_OUT && (
          <p className="mx-auto mb-5 max-w-[26ch] text-xl font-bold leading-tight tracking-tight text-white md:mb-6 md:max-w-[34ch] md:text-3xl">
            {headline}
          </p>
        )}
        <Button
          variant="hero"
          size="xl"
          disabled={ALL_VARIANTS_SOLD_OUT}
          className="h-14 w-full text-base transition-shadow duration-500 md:h-16 md:w-auto md:min-w-[320px] md:text-lg"
          style={{ boxShadow: ctaShadow }}
          onClick={onBuyClick}
        >
          {ctaLabel}
        </Button>
      </div>
    </motion.section>
  );
};

export default OfferCTA;
