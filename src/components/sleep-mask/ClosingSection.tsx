import type { Ref } from "react";
import { Reveal } from "@/components/Reveal";
import { MaskPackPicker } from "@/components/sleep-mask/MaskPackPicker";
import { ALL_MASK_COLORS_SOLD_OUT, type MaskColorId } from "@/lib/mask-colors";

interface ClosingSectionProps {
  picks: readonly MaskColorId[];
  onQuantityChange: (quantity: number) => void;
  onPickChange: (index: number, color: MaskColorId) => void;
  onColorIntent: () => void;
  onBuyClick: () => void;
  sectionRef: Ref<HTMLElement>;
}

/**
 * El cierre repite la decision entera (cantidad, colores, boton) para el que llego
 * hasta el final sin volver arriba. La barra fija de mobile se esconde
 * mientras esta seccion esta en pantalla: dos botones iguales a la vez
 * compiten por el mismo dedo.
 */
export const ClosingSection = ({ picks, onQuantityChange, onPickChange, onColorIntent, onBuyClick, sectionRef }: ClosingSectionProps) => (
  <section
    ref={sectionRef}
    aria-labelledby="mask-closing-title"
    className="relative overflow-hidden bg-black px-5 pb-28 pt-24 sm:px-8 md:pb-36 md:pt-32"
  >
    {/* La unica luz que queda en la pagina es la del boton. */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] bg-[radial-gradient(ellipse_50%_60%_at_50%_100%,hsl(var(--primary)/0.14),transparent_70%)]"
    />

    <Reveal className="relative mx-auto flex max-w-[640px] flex-col items-center text-center">
      <h2
        id="mask-closing-title"
        className="max-w-[14ch] text-[38px] font-bold leading-[1] tracking-[-0.035em] text-white [text-wrap:balance] md:text-6xl"
      >
        Esta noche, la oscuridad la ponés vos.
      </h2>

      <MaskPackPicker
        picks={picks}
        onQuantityChange={onQuantityChange}
        onPickChange={onPickChange}
        onColorIntent={onColorIntent}
        className="mt-10 w-full max-w-[440px] text-left"
      />

      <button
        type="button"
        onClick={onBuyClick}
        disabled={ALL_MASK_COLORS_SOLD_OUT}
        className="sleep-mask-cta mt-8 w-full sm:w-auto sm:min-w-[320px]"
      >
        {ALL_MASK_COLORS_SOLD_OUT ? "Agotado. Reponemos pronto" : "Comprar ahora"}
      </button>
      <p className="mt-3 text-[13px] text-white/60">Delivery gratis a todo Paraguay. Pagás al recibir.</p>
    </Reveal>
  </section>
);
