import { useEffect } from "react";
import { CheckIcon, TruckIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { BUNDLES, ORIGINAL_UNIT_PRICE } from "@/lib/bundles";
import { VariantPicker } from "@/components/VariantPicker";
import {
  FULL_SET,
  FULL_SET_AVAILABLE,
  VARIANTS,
  VARIANT_IDS,
  isVariantSoldOut,
  resolveSelectableVariant,
  type VariantId,
} from "@/lib/variants";

interface BundleSelectorProps {
  selectedIndex: number;
  onSelect: (index: number) => void;
  picks: VariantId[];
  onPickChange: (unitIndex: number, next: VariantId) => void;
  /** Carga el pack de tres con los tres colores de una. */
  onSelectFullSet: () => void;
}

/** Precio del pack que cubre el dia entero, para mostrarlo en la tira. */
const FULL_SET_BUNDLE = BUNDLES.find((bundle) => bundle.quantity === FULL_SET.length);

const EXPAND = { duration: 0.32, ease: [0.16, 1, 0.3, 1] as const };

// Notice text for every gated color, derived so it stays correct as sold-out
// flags move or stack. Handles one color ("Rojo agotado, vuelve pronto.") and
// several ("Rojo y Amarillo agotados, vuelven pronto."). null when everything
// is in stock, which hides the notice.
const SOLD_OUT_NOTICE =
  (() => {
    const names = VARIANT_IDS.filter(isVariantSoldOut).map((id) =>
      VARIANTS[id].name.replace(/^NOCTE\s+/, ""),
    );
    if (names.length === 0) return null;
    if (names.length === 1) return `${names[0]} agotado, vuelve pronto.`;
    const list = `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`;
    return `${list} agotados, vuelven pronto.`;
  })();

export const BundleSelector = ({
  selectedIndex,
  onSelect,
  picks,
  onPickChange,
  onSelectFullSet,
}: BundleSelectorProps) => {
  // El set esta completo cuando el pack tiene tantas unidades como colores y
  // no hay dos iguales. Sirve para saber si la tira todavia tiene algo que
  // ofrecer o si ya cumplio.
  const hasFullSet =
    picks.length === FULL_SET.length && new Set(picks).size === FULL_SET.length;
  // Defense in depth: if any slot resolves to a sold-out color (deep link,
  // stale localStorage, a flag flipped after the pick was made) correct it back
  // to a sellable color so the checkout snapshot can never carry it.
  useEffect(() => {
    picks.forEach((pick, unitIndex) => {
      if (isVariantSoldOut(pick)) {
        onPickChange(unitIndex, resolveSelectableVariant(pick));
      }
    });
  }, [picks, onPickChange]);

  return (
    <div className="w-full space-y-2.5">
      {BUNDLES.map((bundle, index) => {
        const isSelected = selectedIndex === index;
        const isHighlighted = !!bundle.highlighted;
        const isExpanded = isSelected;

        return (
          <motion.div
            key={bundle.id}
            layout
            transition={EXPAND}
            className={[
              "relative w-full overflow-hidden rounded-xl border transition-[border-color,background-color,box-shadow] duration-300",
              isSelected
                ? "border-variant-active bg-[hsl(var(--variant-active)/0.025)] shadow-[0_8px_22px_-16px_hsl(var(--variant-active)/0.35)]"
                : isHighlighted
                  ? "border-variant-active/25 bg-transparent hover:border-variant-active/50"
                  : "border-white/8 bg-transparent hover:border-white/15",
            ].join(" ")}
          >
            {isSelected && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-variant-active z-10"
              />
            )}

            {isSelected && <span aria-hidden="true" className="laser-border z-10" />}

            <button
              type="button"
              onClick={() => onSelect(index)}
              aria-pressed={isSelected}
              className="block w-full px-4 py-3.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-variant-active focus-visible:ring-inset"
            >
              {bundle.badge && (
                <div className="mb-2 flex">
                  <span
                    className={[
                      "inline-flex items-center gap-1 rounded-md px-2 py-[3px] text-[9px] font-bold uppercase tracking-[0.16em]",
                      isHighlighted ? "text-white" : "bg-gold/90 text-black",
                    ].join(" ")}
                    style={
                      isHighlighted
                        ? {
                            background:
                              "linear-gradient(90deg, hsl(var(--variant-active)), hsl(var(--variant-active) / 0.7))",
                          }
                        : undefined
                    }
                  >
                    {bundle.badge}
                  </span>
                </div>
              )}

              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span
                      className={[
                        "text-[15px] font-semibold leading-none tracking-tight",
                        isSelected || isHighlighted ? "text-white" : "text-white",
                      ].join(" ")}
                    >
                      {bundle.quantity} {bundle.quantity === 1 ? "Unidad" : "Unidades"}
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.16em] text-white">
                      {bundle.label}
                    </span>
                  </div>

                  {bundle.quantity > 1 ? (
                    <p className="mt-1.5 text-[12px] text-white">
                      <span className="line-through mr-1.5 text-white">
                        Gs. {ORIGINAL_UNIT_PRICE.toLocaleString("es-PY")}
                      </span>
                      <span className="font-semibold text-white">
                        Gs. {bundle.unitPrice.toLocaleString("es-PY")}
                      </span>
                      <span className="text-white"> c/u</span>
                    </p>
                  ) : (
                    <p className="mt-1.5 text-[12px] text-white">Para probar el efecto</p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-[18px] font-bold leading-none text-white tracking-tight">
                    Gs. {bundle.price.toLocaleString("es-PY")}
                  </span>
                  {bundle.savings && (
                    <span
                      className={[
                        "inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] px-1.5 py-0.5 rounded",
                        isHighlighted
                          ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30"
                          : "bg-emerald-500/15 text-emerald-400",
                      ].join(" ")}
                    >
                      − Gs. {bundle.savings.toLocaleString("es-PY")}
                    </span>
                  )}
                </div>
              </div>
            </button>

            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  key="picks"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={EXPAND}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4">
                    <div className="h-px bg-white/8 mb-3" />
                    <p className="mb-2.5 text-[10px] uppercase tracking-[0.2em] text-white">
                      {bundle.quantity === 1
                        ? "Elegí tu momento"
                        : "Elegí el momento de cada lente"}
                    </p>
                    {SOLD_OUT_NOTICE && (
                      <p className="mb-2.5 text-[11px] font-medium text-white">
                        {SOLD_OUT_NOTICE}
                      </p>
                    )}
                    <ul className="space-y-2">
                      {Array.from({ length: bundle.quantity }).map((_, unitIdx) => {
                        const pick = resolveSelectableVariant(picks[unitIdx] ?? picks[0]);
                        const v = VARIANTS[pick];
                        return (
                          <li
                            key={unitIdx}
                            className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.02] px-3 py-2"
                          >
                            <div className="flex min-w-0 items-center gap-2.5">
                              {bundle.quantity > 1 && (
                                <span
                                  aria-hidden="true"
                                  className="grid h-5 w-5 place-items-center rounded-full bg-white/5 text-[10px] font-bold text-white ring-1 ring-white/10"
                                >
                                  {unitIdx + 1}
                                </span>
                              )}
                              <div className="min-w-0">
                                <p className="text-[12px] font-medium leading-none text-white capitalize">
                                  {pick}
                                </p>
                                <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-white">
                                  Modo {v.moment}
                                </p>
                              </div>
                            </div>
                            <VariantPicker
                              value={pick}
                              onChange={(next) => onPickChange(unitIdx, next)}
                              size="sm"
                              label={
                                bundle.quantity === 1
                                  ? "Color del lente"
                                  : `Color de la unidad ${unitIdx + 1}`
                              }
                            />
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      {/* El pack completo necesitaba su propio empujon: el cliente que llega
          por el ad del rojo no sabe que puede llevarse los tres, y armar tres
          colores distintos a mano son tres toques que casi nadie da. Un click
          lo deja hecho. Si falta algun color el set no existe, asi que la tira
          no aparece y el selector queda como estaba. */}
      {FULL_SET_AVAILABLE && FULL_SET_BUNDLE && (
        <div
          className="rounded-lg border p-3.5 transition-colors duration-300"
          style={{
            borderColor: hasFullSet ? "rgba(16,185,129,0.35)" : "hsl(var(--variant-active) / 0.35)",
            background: hasFullSet
              ? "rgba(16,185,129,0.06)"
              : "linear-gradient(120deg, hsl(var(--variant-active) / 0.1), transparent 70%)",
          }}
        >
          {hasFullSet ? (
            <div className="flex items-center gap-2.5">
              <CheckIcon className="h-4 w-4 flex-shrink-0 text-emerald-400" strokeWidth={2.5} />
              <p className="text-[12px] leading-snug text-white">
                <span className="font-semibold text-emerald-400">Día entero cubierto.</span>{" "}
                <span className="text-white/70">
                  Te mandamos los tres: amarillo, naranja y rojo.
                </span>
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2.5">
                <span aria-hidden="true" className="mt-[3px] flex flex-shrink-0 gap-1">
                  {FULL_SET.map((id) => (
                    <span
                      key={id}
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: VARIANTS[id].accent }}
                    />
                  ))}
                </span>
                <p className="text-[12px] leading-snug text-white">
                  <span className="font-semibold">Protegete el día entero.</span>{" "}
                  <span className="text-white/70">
                    Un lente para cada momento, los tres en un solo pack.
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={onSelectFullSet}
                className="w-full flex-shrink-0 rounded-md bg-variant-active px-3.5 py-2 text-[12px] font-bold text-white transition-transform duration-150 hover:brightness-110 active:scale-[0.98] sm:w-auto"
              >
                Llevar los tres · Gs. {FULL_SET_BUNDLE.price.toLocaleString("es-PY")}
              </button>
            </div>
          )}
        </div>
      )}

      {/* El envio gratis va pegado a los packs, no en el footer ni en la
          garantia: la duda de cuanto sale mandarlo aparece exactamente cuando
          el cliente esta eligiendo cuantos lleva. El plazo va al lado del
          "gratis" porque el interior tarda mas y prometerle 24 h a Encarnacion
          se paga despues en el WhatsApp. */}
      <div className="flex items-center gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-3.5 py-2.5">
        <TruckIcon className="h-4 w-4 flex-shrink-0 text-emerald-400" aria-hidden="true" />
        <p className="text-[12px] leading-snug text-white">
          <span className="font-semibold text-emerald-400">Envío gratis a todo Paraguay.</span>{" "}
          <span className="text-white/70">24 a 48 h en Asunción y Central, 2 a 4 días al interior.</span>
        </p>
      </div>
    </div>
  );
};

export default BundleSelector;
