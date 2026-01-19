import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { XMarkIcon, TruckIcon, PlusIcon, MinusIcon } from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";

interface QuantitySelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (quantity: number, totalPrice: number) => void;
}

// Fixed bundle pricing strategy
const BUNDLES = [
  {
    quantity: 1,
    price: 199000,
    unitPrice: 199000,
    label: "Personal",
    badge: null,
    highlighted: false,
  },
  {
    quantity: 2,
    price: 299000,
    unitPrice: 149500,
    label: "Pack Pareja",
    badge: "🔥 MÁS VENDIDO: Ahorrás Gs. 99.000",
    highlighted: true,
    savings: 99000, // 398.000 - 299.000
  },
  {
    quantity: 3,
    price: 429000,
    unitPrice: 143000,
    label: "Pack Oficina",
    badge: "Super Ahorro",
    highlighted: false,
    savings: 168000, // 597.000 - 429.000
    allowExtraUnits: true, // Allow adding more units at this price
  },
] as const;

// Price per unit for extra units (same as pack of 3 discount)
const EXTRA_UNIT_PRICE = 143000;

export const QuantitySelector = ({ isOpen, onClose, onContinue }: QuantitySelectorProps) => {
  // Default to the highlighted bundle (Pack Pareja - 2 units)
  const [selectedBundleIndex, setSelectedBundleIndex] = useState(1);
  // Extra units beyond pack of 3 (0 means just the base 3 units)
  const [extraUnits, setExtraUnits] = useState(0);

  // Reset state when modal opens - default to Pack Pareja
  useEffect(() => {
    if (isOpen) {
      setSelectedBundleIndex(1);
      setExtraUnits(0);
    }
  }, [isOpen]);

  const selectedBundle = BUNDLES[selectedBundleIndex];

  // Calculate final quantity and price
  const isOfficePackSelected = selectedBundleIndex === 2;
  const finalQuantity = isOfficePackSelected
    ? selectedBundle.quantity + extraUnits
    : selectedBundle.quantity;
  const finalPrice = isOfficePackSelected
    ? selectedBundle.price + (extraUnits * EXTRA_UNIT_PRICE)
    : selectedBundle.price;

  const handleAddUnit = () => {
    setExtraUnits(prev => Math.min(prev + 1, 7)); // Max 10 total (3 + 7)
  };

  const handleRemoveUnit = () => {
    setExtraUnits(prev => Math.max(prev - 1, 0));
  };

  const handleContinue = () => {
    onContinue(finalQuantity, finalPrice);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[500px] bg-gradient-to-b from-secondary to-black border border-border/50 rounded-xl p-8 md:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] max-h-[90dvh] overflow-y-auto"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="space-y-8">
              {/* Headline */}
              <div className="space-y-4 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                  Elige tu Pack NOCTE<sup className="text-[0.3em]">®</sup>
                </h2>

                <p className="text-base text-muted-foreground leading-relaxed">
                  Aprovecha nuestras ofertas especiales
                </p>
              </div>

              {/* Bundle Options */}
              <div className="space-y-4">
                {BUNDLES.map((bundle, index) => {
                  const isSelected = selectedBundleIndex === index;
                  const unitPrice = bundle.quantity === 1 ? bundle.price : Math.floor(bundle.price / bundle.quantity);

                  return (
                    <motion.button
                      key={index}
                      onClick={() => {
                        setSelectedBundleIndex(index);
                        setExtraUnits(0); // Reset extra units when changing bundle
                      }}
                      className={`
                        relative w-full p-5 rounded-lg border-2 transition-all duration-300
                        ${isSelected
                          ? bundle.highlighted
                            ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                            : 'border-primary bg-primary/5'
                          : bundle.highlighted
                            ? 'border-primary/40 bg-secondary/20 hover:border-primary/60'
                            : 'border-border/30 bg-secondary/10 hover:border-border/50'
                        }
                        ${bundle.highlighted ? 'ring-2 ring-primary/30' : ''}
                      `}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Badge */}
                      {bundle.badge && (
                        <div className={`
                          absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap
                          ${bundle.highlighted
                            ? 'bg-gradient-to-r from-primary to-[#DC2626] text-white shadow-lg'
                            : 'bg-gold text-black'
                          }
                        `}>
                          {bundle.badge}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        {/* Left: Quantity & Label */}
                        <div className="flex items-center gap-4">
                          {/* Radio Circle */}
                          <div className={`
                            w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                            ${isSelected ? 'border-primary' : 'border-border/50'}
                          `}>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-3 h-3 rounded-full bg-primary"
                              />
                            )}
                          </div>

                          <div className="text-left">
                            <p className={`
                              text-lg font-bold
                              ${bundle.highlighted ? 'text-primary' : 'text-foreground'}
                            `}>
                              {bundle.quantity} {bundle.quantity === 1 ? 'Unidad' : 'Unidades'}
                            </p>
                            <p className="text-sm text-muted-foreground">{bundle.label}</p>
                            {bundle.quantity > 1 && (
                              <p className="text-xs text-muted-foreground/70 mt-1">
                                {unitPrice.toLocaleString('es-PY')} Gs c/u
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right: Price */}
                        <div className="text-right">
                          <p className={`
                            text-2xl font-bold
                            ${bundle.highlighted ? 'text-primary' : 'text-foreground'}
                          `}>
                            {bundle.price.toLocaleString('es-PY')} Gs
                          </p>
                          {'savings' in bundle && bundle.savings && (
                            <p className="text-xs text-gold font-medium mt-1">
                              Ahorrás {bundle.savings.toLocaleString('es-PY')} Gs
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Extra Units Control - Only for Pack Oficina */}
              <AnimatePresence>
                {isOfficePackSelected && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-5 bg-gold/10 border border-gold/30 rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            ¿Necesitás más unidades?
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Mismo precio de descuento: {EXTRA_UNIT_PRICE.toLocaleString('es-PY')} Gs c/u
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={handleRemoveUnit}
                            disabled={extraUnits === 0}
                            className={`
                              w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all
                              ${extraUnits === 0
                                ? 'border-border/30 text-muted-foreground/50 cursor-not-allowed'
                                : 'border-gold text-gold hover:bg-gold/10 active:scale-95'
                              }
                            `}
                          >
                            <MinusIcon className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center text-lg font-bold text-foreground">
                            {finalQuantity}
                          </span>
                          <button
                            onClick={handleAddUnit}
                            disabled={extraUnits >= 7}
                            className={`
                              w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all
                              ${extraUnits >= 7
                                ? 'border-border/30 text-muted-foreground/50 cursor-not-allowed'
                                : 'border-gold text-gold hover:bg-gold/10 active:scale-95'
                              }
                            `}
                          >
                            <PlusIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {extraUnits > 0 && (
                        <div className="pt-3 border-t border-gold/20 flex justify-between items-center">
                          <p className="text-sm text-muted-foreground">
                            {selectedBundle.quantity} base + {extraUnits} extra
                          </p>
                          <p className="text-lg font-bold text-gold">
                            Total: {finalPrice.toLocaleString('es-PY')} Gs
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Free Shipping Banner */}
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center justify-center gap-2">
                  <TruckIcon className="w-5 h-5 text-primary" />
                  <p className="text-sm text-primary font-medium">
                    Envío gratis a todo el Paraguay 🇵🇾
                  </p>
                </div>
              </div>

              {/* Continue Button */}
              <Button
                onClick={handleContinue}
                variant="hero"
                size="xl"
                className="w-full h-14 text-base font-semibold"
              >
                Continuar con {finalQuantity} {finalQuantity === 1 ? 'unidad' : 'unidades'} - {finalPrice.toLocaleString('es-PY')} Gs
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QuantitySelector;
