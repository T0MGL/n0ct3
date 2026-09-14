import { useEffect, useState, type Ref } from "react";
import { MaskColorPicker } from "@/components/sleep-mask/MaskColorPicker";
import { IN_USE_PHOTOS } from "@/components/sleep-mask/photos";
import { ALL_MASK_COLORS_SOLD_OUT, MASK_COLOR_IDS, isMaskColorSoldOut, type MaskColorId } from "@/lib/mask-colors";
import { SLEEP_MASK_SOLO_PRICE } from "@/lib/order";
import { cn } from "@/lib/utils";

// Un color agotado no se puede elegir, asi que su foto no se baja.
const PHOTO_COLORS = MASK_COLOR_IDS.filter((id) => !isMaskColorSoldOut(id));

// El cuadro de la foto mide el ancho entero en mobile y 7/12 en desktop, pero
// la foto es cuadrada y cubre un cuadro mas alto que ancho: en 1440x900 se
// dibuja a unos 900px. 64vw cubre ese caso sin pedir la de 1600 en mobile.
const PHOTO_SIZES = "(min-width: 1024px) 64vw, 100vw";

interface MaskHeroProps {
  color: MaskColorId;
  onColorChange: (next: MaskColorId) => void;
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

export const MaskHero = ({ color, onColorChange, onBuyClick, ctaRef }: MaskHeroProps) => {
  const lit = useRoomLit();

  return (
    <section
      aria-labelledby="mask-hero-title"
      className="relative lg:grid lg:min-h-[100dvh] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
    >
      <div className="relative h-[44svh] min-h-[300px] overflow-hidden lg:order-2 lg:h-auto">
        {PHOTO_COLORS.map((id) => (
          <img
            key={id}
            src={IN_USE_PHOTOS[id].src}
            srcSet={IN_USE_PHOTOS[id].srcSet}
            sizes={PHOTO_SIZES}
            alt={IN_USE_PHOTOS[id].alt}
            aria-hidden={id === color ? undefined : true}
            width={1024}
            height={1024}
            decoding="async"
            // La del color por defecto es el LCP. React 18 no reconoce
            // fetchPriority en camelCase, por eso va como atributo crudo.
            {...(id === color ? { fetchpriority: "high" } : { loading: "lazy" as const })}
            className={cn(
              "absolute inset-0 h-full w-full object-cover object-[46%_50%] transition-opacity duration-500 ease-out motion-reduce:transition-none lg:object-[40%_50%]",
              id === color ? "opacity-100" : "opacity-0",
            )}
          />
        ))}

        {/* La habitacion arranca en penumbra y se prende. Es la luz del dia
            que el resto de la pagina le va a apagar. Solo opacidad. */}
        <div
          aria-hidden="true"
          className={cn(
            "absolute inset-0 bg-black transition-opacity duration-[1400ms] [transition-timing-function:var(--ease-smooth)] motion-reduce:transition-none",
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

        <p className="mt-4 max-w-[40ch] text-[15px] leading-relaxed text-white/70 lg:mt-6 lg:text-lg">
          Antifaz 3D NOCTE. Oscuridad total y cero presión en los párpados, para dormir profundo y
          levantarte con energía.
        </p>

        <div className="mt-6 flex items-center justify-between gap-4 lg:mt-10 lg:justify-start lg:gap-10">
          <MaskColorPicker value={color} onChange={onColorChange} />
          <p className="whitespace-nowrap text-[28px] font-bold leading-none tracking-[-0.02em] text-white tabular-nums lg:text-[32px]">
            {SLEEP_MASK_SOLO_PRICE.toLocaleString("es-PY")}
            <span className="ml-1 text-base font-medium tracking-normal text-white/60">Gs</span>
          </p>
        </div>

        <button
          ref={ctaRef}
          type="button"
          onClick={onBuyClick}
          disabled={ALL_MASK_COLORS_SOLD_OUT}
          className="sleep-mask-cta mt-5 w-full lg:mt-8 lg:w-auto lg:min-w-[320px] lg:self-start"
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
