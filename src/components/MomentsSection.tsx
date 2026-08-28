import { ArrowUpRightIcon } from "@heroicons/react/24/outline";
import { Reveal } from "@/components/Reveal";
import { useActiveVariant } from "@/lib/variant-context";
import { MOMENT_ORDER, VARIANTS, isVariantSoldOut, type VariantId } from "@/lib/variants";

interface MomentsSectionProps {
  /** Mismo handler que usa el hero, asi el color elegido aca llega al carrito. */
  onPickChange: (unitIndex: number, next: VariantId) => void;
}

const RAIL_GRADIENT = `${VARIANTS.amarillo.accent}, ${VARIANTS.naranja.accent} 52%, ${VARIANTS.rojo.accent}`;

export const MomentsSection = ({ onPickChange }: MomentsSectionProps) => {
  const { activeVariant, setActiveVariant } = useActiveVariant();

  const pick = (id: VariantId) => {
    setActiveVariant(id);
    onPickChange(0, id);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <section
      id="momentos"
      aria-labelledby="momentos-title"
      className="relative bg-black px-4 py-16 md:px-6 md:py-24 lg:px-12"
    >
      <div className="mx-auto max-w-[1400px]">
        <Reveal as="header" className="max-w-[38ch]">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
            El sistema
          </p>
          <h2
            id="momentos-title"
            className="text-3xl font-bold leading-[1.05] tracking-tighter md:text-5xl lg:text-6xl"
          >
            Cada tramo del día pide otro filtro
          </h2>
        </Reveal>

        {/* Los tres momentos cuelgan de un riel que va del amarillo al rojo: el
            degradado ES el dia, asi que el orden de lectura no se explica con
            texto. En mobile el riel es vertical y en desktop horizontal, por eso
            son dos nodos y no uno rotado: un solo degradado no puede cambiar de
            eje sin que se le note la costura. */}
        <div className="relative mt-10 md:mt-16">
          <div
            aria-hidden="true"
            className="absolute bottom-3 left-[13px] top-3 w-px md:hidden"
            style={{ background: `linear-gradient(to bottom, ${RAIL_GRADIENT})` }}
          />
          <div
            aria-hidden="true"
            className="absolute left-0 right-0 top-[13px] hidden h-px md:block"
            style={{ background: `linear-gradient(to right, ${RAIL_GRADIENT})` }}
          />

          <div className="grid gap-10 md:grid-cols-3 md:gap-8 lg:gap-14">
            {MOMENT_ORDER.map((id, index) => {
              const variant = VARIANTS[id];
              const isActive = activeVariant === id;
              const soldOut = isVariantSoldOut(id);

              return (
                <Reveal
                  key={id}
                  as="article"
                  delay={index * 80}
                  className="relative pl-11 md:pl-0 md:pt-11"
                >
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-0 grid h-[27px] w-[27px] place-items-center rounded-full bg-black"
                  >
                    <span
                      className="block h-[11px] w-[11px] rounded-full transition-transform duration-300"
                      style={{
                        backgroundColor: variant.accent,
                        boxShadow: `0 0 0 ${isActive ? 5 : 0}px ${variant.accent}22, 0 0 18px ${variant.lensGlow}`,
                        transform: isActive ? "scale(1.25)" : "none",
                      }}
                    />
                  </span>

                  <p
                    className="text-[11px] font-bold uppercase tracking-[0.22em]"
                    style={{ color: variant.accent }}
                  >
                    {variant.id}
                  </p>

                  <h3 className="mt-2 text-xl font-bold leading-tight tracking-tight text-white md:text-[22px]">
                    {variant.momentHeadline}
                  </h3>

                  <p className="mt-3 max-w-[46ch] text-[15px] leading-relaxed text-white/70 md:text-base">
                    {variant.momentCopy}
                  </p>

                  {!soldOut && (
                    <button
                      type="button"
                      onClick={() => pick(id)}
                      className="group mt-5 inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity duration-200 hover:opacity-75 active:scale-[0.98]"
                      style={{ color: variant.accent }}
                    >
                      {isActive ? "Es el que tenés elegido" : `Elegir el ${variant.id}`}
                      <ArrowUpRightIcon
                        className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                        strokeWidth={2}
                      />
                    </button>
                  )}
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MomentsSection;
