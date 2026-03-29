import { motion } from "framer-motion";
import { BUNDLES, ORIGINAL_UNIT_PRICE } from "@/lib/bundles";

interface BundleSelectorProps {
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export const BundleSelector = ({ selectedIndex, onSelect }: BundleSelectorProps) => {
  return (
    <div className="space-y-3 w-full">
      {BUNDLES.map((bundle, index) => {
        const isSelected = selectedIndex === index;

        return (
          <motion.button
            key={bundle.id}
            onClick={() => onSelect(index)}
            className={`
              relative w-full p-4 rounded-lg border-2 transition-all duration-300 text-left
              ${isSelected
                ? bundle.highlighted
                  ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                  : 'border-primary bg-primary/5'
                : bundle.highlighted
                  ? 'border-primary/40 bg-secondary/20 hover:border-primary/60'
                  : 'border-border/30 bg-secondary/10 hover:border-border/50'
              }
            `}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            {/* Subtle pulse on highlighted card when not selected */}
            {bundle.highlighted && !isSelected && (
              <motion.div
                className="absolute inset-0 rounded-lg border-2 border-primary/30 pointer-events-none"
                initial={{ opacity: 0.6 }}
                animate={{ opacity: [0.6, 0.15, 0.6] }}
                transition={{ duration: 2, repeat: 1, ease: "easeInOut" }}
              />
            )}

            {/* Badge */}
            {bundle.badge && (
              <div className={`
                absolute -top-3 right-4 px-3 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase
                ${bundle.highlighted
                  ? 'bg-gradient-to-r from-primary to-[#DC2626] text-white'
                  : 'bg-gold text-black'
                }
              `}>
                {bundle.highlighted && <span className="mr-1">🔥</span>}{bundle.badge}
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              {/* Radio + Info */}
              <div className="flex items-center gap-3 min-w-0">
                {/* Radio indicator */}
                <div className={`
                  w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all
                  ${isSelected ? 'border-primary' : 'border-border/50'}
                `}>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="w-2.5 h-2.5 rounded-full bg-primary"
                    />
                  )}
                </div>

                {/* Bundle info */}
                <div className="min-w-0">
                  <p className={`
                    text-sm font-bold leading-tight
                    ${bundle.highlighted ? 'text-primary' : 'text-foreground'}
                  `}>
                    {bundle.quantity} {bundle.quantity === 1 ? 'Unidad' : 'Unidades'} — {bundle.label}
                  </p>
                  {bundle.quantity > 1 && (
                    <p className={`mt-0.5 ${bundle.highlighted ? 'text-sm font-semibold text-primary/80' : 'text-xs text-muted-foreground'}`}>
                      {bundle.highlighted && (
                        <span className="line-through text-muted-foreground/50 font-normal mr-1">
                          {ORIGINAL_UNIT_PRICE.toLocaleString('es-PY')}
                        </span>
                      )}
                      {bundle.unitPrice.toLocaleString('es-PY')} Gs c/u
                    </p>
                  )}
                  {bundle.highlighted && (
                    <span className="text-[11px] text-primary/60 mt-0.5 block">
                      2 lentes, pagas menos por cada uno
                    </span>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="text-right flex-shrink-0">
                <p className={`
                  text-lg font-bold leading-tight
                  ${bundle.highlighted ? 'text-primary' : 'text-foreground'}
                `}>
                  {bundle.price.toLocaleString('es-PY')} Gs
                </p>
                {bundle.savings && (
                  <p className={`font-medium mt-0.5 ${
                    bundle.highlighted
                      ? 'text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full inline-block'
                      : 'text-[11px] text-gold'
                  }`}>
                    Ahorrás {bundle.savings.toLocaleString('es-PY')} Gs
                  </p>
                )}
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};

export default BundleSelector;
