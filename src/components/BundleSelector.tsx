import { motion } from "framer-motion";
import { BUNDLES } from "@/lib/bundles";

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
          >
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
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {bundle.unitPrice.toLocaleString('es-PY')} Gs c/u
                    </p>
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
                  <p className="text-[11px] text-gold font-medium mt-0.5">
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
