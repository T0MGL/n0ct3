import type { Ref } from "react";
import { Reveal } from "@/components/Reveal";
import { CLIP_ON } from "@/lib/order";
import { formatPrice } from "@/lib/stripe";

interface ClipOnClosingProps {
  onBuyClick: () => void;
  sectionRef: Ref<HTMLElement>;
}

/**
 * Mismo cierre que /sleep-mask: precio y boton para el que llego hasta el
 * final sin volver arriba. La barra fija se esconde mientras esta seccion esta
 * en pantalla, asi no hay dos botones iguales peleando por el mismo dedo.
 */
export const ClipOnClosing = ({ onBuyClick, sectionRef }: ClipOnClosingProps) => (
  <section
    ref={sectionRef}
    aria-labelledby="clipon-closing-title"
    className="relative overflow-hidden bg-black px-5 pb-28 pt-24 sm:px-8 md:pb-36 md:pt-32"
  >
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] bg-[radial-gradient(ellipse_50%_60%_at_50%_100%,hsl(var(--primary)/0.14),transparent_70%)]"
    />

    <Reveal className="relative mx-auto flex max-w-[640px] flex-col items-center text-center">
      <h2
        id="clipon-closing-title"
        className="max-w-[14ch] text-[38px] font-bold leading-[1] tracking-[-0.035em] text-white [text-wrap:balance] md:text-6xl"
      >
        Esta noche, con tus lentes de siempre.
      </h2>

      <p className="mt-8 text-[28px] font-bold leading-none tracking-[-0.02em] tabular-nums text-white md:text-4xl">
        {formatPrice(CLIP_ON.price, "pyg")}
      </p>

      <button type="button" onClick={onBuyClick} className="sleep-mask-cta mt-6 w-full sm:w-auto sm:min-w-[320px]">
        Comprar ahora
      </button>
      <p className="mt-3 text-[13px] text-white/60">Envío gratis a todo Paraguay. Pagás al recibir.</p>
    </Reveal>
  </section>
);
