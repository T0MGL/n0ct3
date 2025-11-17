import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { XMarkIcon, MinusIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

interface QuantitySelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (quantity: number) => void;
}

const UNIT_PRICE = 279000;

export const QuantitySelector = ({ isOpen, onClose, onContinue }: QuantitySelectorProps) => {
  const [quantity, setQuantity] = useState(1);

  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < 10) {
      setQuantity(quantity + 1);
    }
  };

  const totalPrice = UNIT_PRICE * quantity;

  const handleContinue = () => {
    onContinue(quantity);
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
            className="relative w-full max-w-[500px] bg-gradient-to-b from-secondary to-black border border-border/50 rounded-xl p-8 md:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]"
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
                  ¿Cuántos NOCTE<sup className="text-[0.3em]">®</sup> quieres?
                </h2>

                <p className="text-base text-muted-foreground leading-relaxed">
                  Selecciona la cantidad que deseas adquirir
                </p>
              </div>

              {/* Quantity Selector */}
              <div className="space-y-6">
                <div className="flex items-center justify-center gap-6">
                  <button
                    onClick={handleDecrease}
                    disabled={quantity <= 1}
                    className="w-12 h-12 flex items-center justify-center rounded-lg bg-secondary/50 border border-border/50 text-foreground hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                  >
                    <MinusIcon className="w-5 h-5" />
                  </button>

                  <div className="w-24 text-center">
                    <p className="text-5xl font-bold text-foreground">{quantity}</p>
                  </div>

                  <button
                    onClick={handleIncrease}
                    disabled={quantity >= 10}
                    className="w-12 h-12 flex items-center justify-center rounded-lg bg-secondary/50 border border-border/50 text-foreground hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                  >
                    <PlusIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Price Summary */}
                <div className="p-5 bg-secondary/30 border border-border/30 rounded-lg space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Precio unitario</span>
                    <span className="text-foreground font-medium">
                      {UNIT_PRICE.toLocaleString('es-PY')} Gs
                    </span>
                  </div>

                  <div className="border-t border-border/30 pt-3 flex justify-between items-center">
                    <span className="text-lg font-semibold text-foreground">Total</span>
                    <span className="text-2xl font-bold text-primary">
                      {totalPrice.toLocaleString('es-PY')} Gs
                    </span>
                  </div>
                </div>

                {quantity === 1 && (
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <p className="text-sm text-center text-primary font-medium">
                      Obtén 50% OFF en la segunda unidad
                    </p>
                  </div>
                )}
              </div>

              {/* Continue Button */}
              <Button
                onClick={handleContinue}
                variant="hero"
                size="xl"
                className="w-full h-14 text-base font-semibold"
              >
                Continuar con {quantity} {quantity === 1 ? 'unidad' : 'unidades'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QuantitySelector;
