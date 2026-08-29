import { useEffect, useState } from "react";
import { ArrowUpRightIcon } from "@heroicons/react/24/outline";
import { Reveal } from "@/components/Reveal";
import { useActiveVariant } from "@/lib/variant-context";
import {
  MOMENT_ORDER,
  VARIANTS,
  isVariantSoldOut,
  momentWindowLabel,
  variantForHour,
  type VariantId,
} from "@/lib/variants";

interface MomentsSectionProps {
  /** Mismo handler que usa el hero, asi el color elegido aca llega al carrito. */
  onPickChange: (unitIndex: number, next: VariantId) => void;
}

/**
 * El reloj no arranca a medianoche sino a las 7, cuando empieza el amarillo.
 * Arrancando a las 00:00 el rojo queda partido en dos (la madrugada de un
 * extremo y la noche del otro) y la barra deja de leerse como un dia.
 */
const DAY_START = 7;

const spanHours = (id: VariantId): number => {
  const [from, to] = VARIANTS[id].dayRange;
  return from < to ? to - from : 24 - from + to;
};

/** Posicion 0 a 1 de una hora decimal sobre la barra que arranca a las 7. */
const positionOf = (hourDecimal: number): number =>
  (((hourDecimal - DAY_START) % 24) + 24) % 24 / 24;

const formatClock = (d: Date): string =>
  `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

const useLocalNow = (): Date => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
};

export const MomentsSection = ({ onPickChange }: MomentsSectionProps) => {
  const { activeVariant, setActiveVariant } = useActiveVariant();
  const now = useLocalNow();
  const currentId = variantForHour(now.getHours());
  const needle = positionOf(now.getHours() + now.getMinutes() / 60);

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
        <Reveal as="header" className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-[34ch]">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
              El sistema
            </p>
            <h2
              id="momentos-title"
              className="text-3xl font-bold leading-[1.05] tracking-tighter md:text-5xl lg:text-6xl"
            >
              Cada tramo del día pide otro filtro
            </h2>
          </div>

          {/* El reloj del visitante convertido en argumento: no le contamos
              cual usar en abstracto, le decimos cual le toca en este momento.
              La hora exacta la lleva la aguja de la barra, no esta linea, asi
              que el mismo dato no aparece dos veces. */}
          <p className="max-w-[26ch] text-lg font-medium leading-snug text-white/70 md:text-right md:text-xl">
            Ahora mismo te toca el{" "}
            <span className="font-bold" style={{ color: VARIANTS[currentId].accent }}>
              {currentId}
            </span>
            .
          </p>
        </Reveal>

        {/* La barra ES el dia: veinticuatro horas de izquierda a derecha, cada
            franja tan ancha como horas dura, y la aguja parada en la hora del
            visitante. */}
        <Reveal delay={60} className="mt-10 md:mt-14">
          <div className="relative pt-8">
            <div
              className="absolute top-0 -translate-x-1/2 transition-[left] duration-700"
              style={{ left: `${needle * 100}%` }}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="whitespace-nowrap rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-black">
                  Ahora {formatClock(now)}
                </span>
                <span className="h-3 w-px bg-white/70" />
              </div>
            </div>

            {/* Sin role="img" en el contenedor: volvia presentacional todo el
                subarbol y los tres botones desaparecian del arbol de
                accesibilidad. La descripcion va en un parrafo solo para
                lectores y cada boton conserva su propia etiqueta. */}
            <p className="sr-only">
              Reloj del día:{" "}
              {MOMENT_ORDER.map((id) => `${id} de ${momentWindowLabel(id)}`).join(", ")}. Ahora
              son las {formatClock(now)}.
            </p>
            <div className="flex h-10 overflow-hidden rounded-lg md:h-12">
              {/* Sin nombres adentro de la barra: la franja del naranja dura
                  tres horas y cualquier palabra ahi entra apretada o se corta.
                  El nombre lo lleva la tarjeta de abajo, y el vinculo entre
                  las dos cosas es el color, que es justamente el tema. */}
              {MOMENT_ORDER.map((id) => {
                const variant = VARIANTS[id];
                const isSelected = activeVariant === id;
                return (
                  <button
                    key={id}
                    type="button"
                    disabled={isVariantSoldOut(id)}
                    onClick={() => pick(id)}
                    aria-label={`Elegir ${variant.name}`}
                    style={{
                      flexGrow: spanHours(id),
                      flexBasis: 0,
                      background: `linear-gradient(180deg, ${variant.accent}, ${variant.accent}c4)`,
                      boxShadow: isSelected ? "inset 0 0 0 2px rgba(255,255,255,0.85)" : "none",
                    }}
                    className="relative transition-shadow duration-300 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-40"
                  />
                );
              })}
            </div>

            {/* Las marcas van solo en los bordes de las franjas: son las horas
                en las que hay que cambiar de lente, que es la unica info util. */}
            <div className="relative mt-2 h-4">
              <span className="absolute left-0 text-[10px] font-medium tabular-nums text-white/40">
                07:00
              </span>
              {[17, 20].map((hour) => (
                <span
                  key={hour}
                  className="absolute -translate-x-1/2 text-[10px] font-medium tabular-nums text-white/40"
                  style={{ left: `${positionOf(hour) * 100}%` }}
                >
                  {String(hour).padStart(2, "0")}:00
                </span>
              ))}
              <span className="absolute right-0 text-[10px] font-medium tabular-nums text-white/40">
                07:00
              </span>
            </div>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-4 md:mt-14 md:grid-cols-3 md:gap-5">
          {MOMENT_ORDER.map((id, index) => {
            const variant = VARIANTS[id];
            const isNow = currentId === id;
            const isSelected = activeVariant === id;
            const soldOut = isVariantSoldOut(id);

            return (
              <Reveal
                key={id}
                as="article"
                delay={index * 80}
                className="relative flex flex-col overflow-hidden rounded-xl border p-6 transition-colors duration-300 md:p-7"
                style={{
                  borderColor: isNow || isSelected ? `${variant.accent}59` : "rgba(255,255,255,0.08)",
                  background: isNow
                    ? `linear-gradient(160deg, ${variant.accent}14, transparent 62%)`
                    : "rgba(255,255,255,0.015)",
                }}
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-[3px]"
                  style={{ backgroundColor: variant.accent, opacity: isNow || isSelected ? 1 : 0.3 }}
                />

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p
                      className="text-[11px] font-bold uppercase tracking-[0.22em]"
                      style={{ color: variant.accent }}
                    >
                      {variant.id}
                    </p>
                    <p className="mt-1 text-[11px] font-medium tabular-nums text-white/40">
                      {momentWindowLabel(id)}
                    </p>
                  </div>

                  {isNow && (
                    <span
                      className="whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]"
                      style={{ backgroundColor: variant.accent, color: "#000" }}
                    >
                      Te toca ahora
                    </span>
                  )}
                </div>

                <p className="mt-5 flex items-baseline gap-1.5 font-bold leading-none tracking-tighter text-white">
                  <span className="text-5xl tabular-nums md:text-6xl">{variant.blockedPercent}</span>
                  <span className="text-xl md:text-2xl" style={{ color: variant.accent }}>
                    %
                  </span>
                </p>
                <p className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-white/40">
                  de luz azul bloqueada
                </p>

                <h3 className="mt-6 text-xl font-bold leading-tight tracking-tight text-white md:text-[22px]">
                  {variant.momentHeadline}
                </h3>

                <p className="mt-2.5 text-[15px] leading-relaxed text-white/70">
                  {variant.momentCopy}
                </p>

                {!soldOut && (
                  <button
                    type="button"
                    onClick={() => pick(id)}
                    className="group mt-auto inline-flex items-center gap-1.5 self-start rounded pt-6 text-sm font-semibold transition-opacity duration-200 hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-black active:scale-[0.98]"
                    style={{ color: variant.accent }}
                  >
                    {isSelected ? "Es el que tenés elegido" : `Elegir el ${variant.id}`}
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
    </section>
  );
};

export default MomentsSection;
