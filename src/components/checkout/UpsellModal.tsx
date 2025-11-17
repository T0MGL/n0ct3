import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface UpsellModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUpsell: (colors: [string, string]) => void;
  onSelectSingle: () => void;
}

export const UpsellModal = ({ isOpen, onClose, onSelectUpsell, onSelectSingle }: UpsellModalProps) => {
  const handleAcceptUpsell = () => {
    onSelectUpsell(["rojo-clasico", "rojo-clasico"]); // Same product, just quantity 2
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
              <X className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="space-y-8">
              {/* Headline */}
              <div className="space-y-4 text-center">
                <div className="inline-block px-3 py-1 bg-primary/10 border border-primary/20 rounded-md">
                  <p className="text-xs font-semibold text-primary tracking-wide">
                    OFERTA ESPECIAL
                  </p>
                </div>

                <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                  Lleva 2 NOCTE<sup className="text-[0.3em]">®</sup> al 50% OFF
                </h2>

                <p className="text-base text-muted-foreground leading-relaxed">
                  Segunda unidad con 50% de descuento
                </p>
              </div>

              {/* Pricing Comparison */}
              <div className="space-y-4">
                {/* Option 1 - Single */}
                <div className="p-5 bg-secondary/30 border border-border/30 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-foreground">1 NOCTE<sup className="text-[0.3em]">®</sup></h3>
                    <span className="text-2xl font-bold text-foreground">279,000 Gs</span>
                  </div>
                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    <p>1 lente + estuche + paño</p>
                  </div>
                </div>

                {/* Option 2 - Bundle (Highlighted) */}
                <div className="p-5 bg-primary/5 border-2 border-primary/30 rounded-lg relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary rounded-md">
                    <p className="text-xs font-bold text-white tracking-wide">RECOMENDADO</p>
                  </div>

                  <div className="flex justify-between items-center mb-3 mt-1">
                    <h3 className="text-lg font-semibold text-foreground">2 NOCTE<sup className="text-[0.3em]">®</sup></h3>
                    <div className="text-right">
                      <span className="text-sm text-muted-foreground line-through block">558,000 Gs</span>
                      <span className="text-2xl font-bold text-primary">418,500 Gs</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-sm text-muted-foreground mb-3">
                    <p>2 lentes + 2 estuches + 2 paños</p>
                  </div>

                  <div className="pt-3 border-t border-border/30">
                    <p className="text-sm font-semibold text-accent">
                      Ahorras 139,500 Gs
                    </p>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="space-y-3 pt-2">
                <Button
                  onClick={handleAcceptUpsell}
                  variant="hero"
                  size="xl"
                  className="w-full h-14 text-base font-semibold"
                >
                  Sí, quiero 2 NOCTE<sup className="text-[0.3em]">®</sup> con 50% OFF
                </Button>

                <Button
                  onClick={onSelectSingle}
                  variant="outline"
                  size="lg"
                  className="w-full h-12 text-sm font-medium bg-transparent border-border/50 hover:bg-secondary/50"
                >
                  No, prefiero solo 1
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
