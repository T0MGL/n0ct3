import { AnimatePresence, motion } from "framer-motion";
import { BUNDLES, ORIGINAL_UNIT_PRICE } from "@/lib/bundles";
import { VariantPicker } from "@/components/VariantPicker";
import { VARIANTS, type VariantId } from "@/lib/variants";

interface BundleSelectorProps {
  selectedIndex: number;
  onSelect: (index: number) => void;
  picks: VariantId[];
  onPickChange: (unitIndex: number, next: VariantId) => void;
}

const EXPAND = { duration: 0.32, ease: [0.16, 1, 0.3, 1] as const };

export const BundleSelector = ({
  selectedIndex,
  onSelect,
  picks,
  onPickChange,
}: BundleSelectorProps) => {
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
                        isSelected || isHighlighted ? "text-white" : "text-white/85",
                      ].join(" ")}
                    >
                      {bundle.quantity} {bundle.quantity === 1 ? "Unidad" : "Unidades"}
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                      {bundle.label}
                    </span>
                  </div>

                  {bundle.quantity > 1 ? (
                    <p className="mt-1.5 text-[12px] text-white/55">
                      <span className="line-through mr-1.5 text-white/30">
                        Gs. {ORIGINAL_UNIT_PRICE.toLocaleString("es-PY")}
                      </span>
                      <span className="font-semibold text-white/75">
                        Gs. {bundle.unitPrice.toLocaleString("es-PY")}
                      </span>
                      <span className="text-white/45"> c/u</span>
                    </p>
                  ) : (
                    <p className="mt-1.5 text-[12px] text-white/55">Para probar el efecto</p>
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
                    <p className="mb-2.5 text-[10px] uppercase tracking-[0.2em] text-white/45">
                      {bundle.quantity === 1
                        ? "Elegí el color del lente"
                        : "Elegí el color de cada lente"}
                    </p>
                    <ul className="space-y-2">
                      {Array.from({ length: bundle.quantity }).map((_, unitIdx) => {
                        const pick = picks[unitIdx] ?? picks[0];
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
                                  className="grid h-5 w-5 place-items-center rounded-full bg-white/5 text-[10px] font-bold text-white/75 ring-1 ring-white/10"
                                >
                                  {unitIdx + 1}
                                </span>
                              )}
                              <div className="min-w-0">
                                <p className="text-[12px] font-medium leading-none text-white/85 capitalize">
                                  {pick}
                                </p>
                                <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-white/40">
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
    </div>
  );
};

export default BundleSelector;
