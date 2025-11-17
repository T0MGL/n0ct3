import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CreditCardIcon, BanknotesIcon } from "@heroicons/react/24/outline";

interface PaymentFallbackModalProps {
  isOpen: boolean;
  onPayOnDelivery: () => void;
  onRetryPayment: () => void;
  onCancel: () => void;
}

export const PaymentFallbackModal = ({
  isOpen,
  onPayOnDelivery,
  onRetryPayment,
  onCancel,
}: PaymentFallbackModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative w-full max-w-[500px] bg-gradient-to-b from-secondary to-black border-2 border-primary rounded-2xl p-6 md:p-8 shadow-[0_20px_25px_-5px_rgba(239,68,68,0.2)]"
          >
            <div className="space-y-6">
              {/* Icon */}
              <div className="flex justify-center">
                <div className="p-4 bg-primary/10 rounded-full">
                  <CreditCardIcon className="w-12 h-12 text-primary" />
                </div>
              </div>

              {/* Headline */}
              <div className="text-center space-y-3">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  ¿Problema con el pago?
                </h2>
                <p className="text-base text-muted-foreground">
                  No te preocupes, tenemos otras opciones para ti
                </p>
              </div>

              {/* Options */}
              <div className="space-y-4">
                {/* Option 1 - Pago contra entrega */}
                <div className="p-5 bg-accent/10 border-2 border-accent rounded-xl space-y-3 relative overflow-hidden">
                  <div className="absolute top-2 right-2 px-2 py-1 bg-accent rounded-full">
                    <p className="text-xs font-bold text-black">RECOMENDADO</p>
                  </div>

                  <div className="flex items-start gap-3">
                    <BanknotesIcon className="w-8 h-8 text-accent flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-foreground mb-2">
                        Pago contra entrega
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Paga en efectivo cuando recibas tus lentes NOCTE<sup className="text-[0.3em]">®</sup>.
                        Sin tarjeta, sin complicaciones.
                      </p>
                      <div className="space-y-1.5">
                        <p className="text-xs text-foreground flex items-center gap-2">
                          ✓ Paga al recibir el producto
                        </p>
                        <p className="text-xs text-foreground flex items-center gap-2">
                          ✓ Inspecciona antes de pagar
                        </p>
                        <p className="text-xs text-foreground flex items-center gap-2">
                          ✓ Mismo precio, sin cargos extra
                        </p>
                        <p className="text-xs text-foreground flex items-center gap-2">
                          ✓ 100% seguro y confiable
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={onPayOnDelivery}
                    variant="hero"
                    size="lg"
                    className="w-full mt-3 font-bold"
                  >
                    Continuar con pago contra entrega
                  </Button>
                </div>

                {/* Option 2 - Reintentar pago */}
                <div className="p-4 bg-secondary/30 border border-border rounded-lg">
                  <div className="flex items-start gap-3 mb-3">
                    <CreditCardIcon className="w-6 h-6 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-foreground mb-1">
                        Reintentar pago digital
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Vuelve a intentar con Face ID, Google Pay o tarjeta
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={onRetryPayment}
                    variant="outline"
                    size="default"
                    className="w-full bg-secondary/50 hover:bg-secondary/80"
                  >
                    Reintentar pago
                  </Button>
                </div>
              </div>

              {/* Info Box */}
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-xs text-blue-400 text-center">
                  💡 El pago contra entrega es igual de seguro. Muchos clientes lo prefieren.
                </p>
              </div>

              {/* Cancel */}
              <button
                onClick={onCancel}
                className="w-full text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors"
              >
                Cancelar y volver atrás
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PaymentFallbackModal;
