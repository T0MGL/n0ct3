import { useEffect, useState, type Ref } from "react";
import { MaskCountdown } from "@/components/sleep-mask/MaskCountdown";
import { MaskPackPicker } from "@/components/sleep-mask/MaskPackPicker";
import { ColorPhotoStack } from "@/components/sleep-mask/ColorPhotoStack";
import { IN_USE_PHOTOS, IN_USE_SIZES } from "@/components/sleep-mask/photos";
import { ALL_MASK_COLORS_SOLD_OUT, type MaskColorId } from "@/lib/mask-colors";
import { cn } from "@/lib/utils";

interface MaskHeroProps {
  picks: readonly MaskColorId[];
  /** El color activo de la pagina (la regla de color de SleepMask.tsx). */
  photoColor: MaskColorId;
  onQuantityChange: (quantity: number) => void;
  onPickChange: (index: number, color: MaskColorId) => void;
  onColorIntent: () => void;
  onBuyClick: () => void;
  ctaRef: Ref<HTMLButtonElement>;
}

/**
 * La habitacion se prende cuando se va el preloader, no al montar: montando,
 * la transicion corria debajo del overlay negro y nadie la veia. Sin
 * preloader (ya visto en la sesion) arranca en el frame siguiente, y el
 * respaldo de 2,6 s cubre un build sin el.
 */
const useRoomLit = (): boolean => {
  const [lit, setLit] = useState(false);

  useEffect(() => {
    const turnOn = () => setLit(true);
    if (document.documentElement.dataset.npl === "done") {
      const frame = requestAnimationFrame(turnOn);
      return () => cancelAnimationFrame(frame);
    }
    window.addEventListener("nocte:ready", turnOn, { once: true });
    const fallback = setTimeout(turnOn, 2600);
    return () => {
      window.removeEventListener("nocte:ready", turnOn);
      clearTimeout(fallback);
    };
  }, []);

  return lit;
};

export const MaskHero = ({ picks, photoColor: color, onQuantityChange, onPickChange, onColorIntent, onBuyClick, ctaRef }: MaskHeroProps) => {
  const lit = useRoomLit();

  return (
    <section
      aria-labelledby="mask-hero-title"
      className="relative lg:grid lg:min-h-[100dvh] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
    >
      <div className="relative h-[38svh] min-h-[260px] overflow-hidden lg:order-2 lg:h-auto">
        <ColorPhotoStack
          color={color}
          photos={IN_USE_PHOTOS}
          sizes={IN_USE_SIZES}
          priority
          className="absolute inset-0"
          imgClassName="object-[46%_50%] lg:object-[40%_50%]"
        />

        {/* La habitacion arranca en penumbra y se prende. Es la luz del dia
            que el resto de la pagina le va a apagar. Solo opacidad. */}
        <div
          aria-hidden="true"
          className={cn(
            "absolute inset-0 bg-black transition-opacity [transition-duration:1400ms] [transition-timing-function:var(--ease-smooth)] motion-reduce:transition-none",
            lit ? "opacity-0" : "opacity-60",
          )}
        />

        {/* La foto se funde en el negro de la pagina: abajo en mobile, donde
            sigue el texto, y a la izquierda en desktop. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black to-transparent lg:inset-y-0 lg:left-0 lg:right-auto lg:h-auto lg:w-1/3 lg:bg-gradient-to-r"
        />
      </div>

      <div className="relative -mt-14 px-5 pb-10 sm:px-8 lg:order-1 lg:mt-0 lg:flex lg:flex-col lg:justify-center lg:py-28 lg:pl-[max(3rem,calc((100vw-1400px)/2+3rem))] lg:pr-10">
        <h1
          id="mask-hero-title"
          className="max-w-[12ch] text-[36px] font-bold leading-[1.02] tracking-[-0.035em] text-white [text-wrap:balance] sm:text-5xl lg:text-[64px] lg:leading-[0.98]"
        >
          Apagá la luz que no podés apagar.
        </h1>

        <p className="mt-3 max-w-[40ch] text-[15px] leading-snug text-white/70 lg:mt-6 lg:text-lg lg:leading-relaxed">
          Antifaz 3D NOCTE. Oscuridad total y cero presión en los párpados, para dormir profundo y
          levantarte con energía.
        </p>

        {/* El reloj va arriba de los precios del pack. Es solo pantalla: los
            precios no vencen y nada del pedido lo lee. */}
        <MaskCountdown className="mt-5 lg:mt-8" />
        <MaskPackPicker
          announce
          picks={picks}
          onQuantityChange={onQuantityChange}
          onPickChange={onPickChange}
          onColorIntent={onColorIntent}
          className="mt-2.5 lg:max-w-[440px]"
        />

        <button
          ref={ctaRef}
          type="button"
          onClick={onBuyClick}
          disabled={ALL_MASK_COLORS_SOLD_OUT}
          className="sleep-mask-cta mt-4 w-full lg:mt-6 lg:w-auto lg:min-w-[320px] lg:self-start"
        >
          {ALL_MASK_COLORS_SOLD_OUT ? "Agotado. Reponemos pronto" : "Comprar ahora"}
        </button>

        <p className="mt-3 text-[13px] text-white/60 lg:text-sm">
          Delivery gratis a todo Paraguay. Pagás al recibir.
        </p>
      </div>
    </section>
  );
};
