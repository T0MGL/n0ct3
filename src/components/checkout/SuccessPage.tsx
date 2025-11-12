import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

interface SuccessPageProps {
  isOpen: boolean;
  orderData: {
    orderNumber: string;
    products: string;
    total: string;
    location: string;
    phone: string;
    name: string;
  };
  onClose: () => void;
}

export const SuccessPage = ({ isOpen, orderData, onClose }: SuccessPageProps) => {
  const handleWhatsApp = () => {
    const phoneNumber = orderData.phone.replace(/\D/g, "");
    const message = encodeURIComponent(
      `Hola! Acabo de completar mi orden ${orderData.orderNumber} por ${orderData.products}. Total: ${orderData.total}`
    );
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative w-full max-w-[550px] bg-gradient-to-b from-secondary to-black border-2 border-[#4ADE80] rounded-2xl p-6 md:p-8 shadow-[0_20px_25px_-5px_rgba(74,222,128,0.2)]"
          >
            <div className="space-y-6 text-center">
              {/* Success Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
                className="flex justify-center"
              >
                <CheckCircleIcon className="w-20 h-20 text-[#4ADE80]" />
              </motion.div>

              {/* Headline */}
              <div className="space-y-2">
                <h2 className="text-3xl md:text-5xl font-bold text-[#4ADE80]">
                  ¡Gracias por tu compra! 🎉
                </h2>
                <p className="text-lg md:text-xl text-muted-foreground">
                  Tu orden ha sido confirmada
                </p>
              </div>

              {/* Details */}
              <div className="p-6 bg-secondary/50 border border-border rounded-xl space-y-3 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Número de orden:</span>
                  <span className="text-sm font-bold text-foreground">{orderData.orderNumber}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Productos:</span>
                  <span className="text-sm font-semibold text-foreground">{orderData.products}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total:</span>
                  <span className="text-base font-bold text-primary">{orderData.total}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Estado:</span>
                  <span className="text-sm font-semibold text-[#4ADE80]">Preparando para envío</span>
                </div>

                <div className="flex justify-between items-start">
                  <span className="text-sm text-muted-foreground">Ubicación:</span>
                  <span className="text-sm font-medium text-foreground text-right">
                    📍 {orderData.location}
                  </span>
                </div>
              </div>

              {/* Confirmations */}
              <div className="space-y-2 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-400 flex items-start gap-2">
                  <span>✓</span>
                  <span>Recibirás confirmación por WhatsApp a: {orderData.phone}</span>
                </p>
                <p className="text-sm text-blue-400 flex items-start gap-2">
                  <span>✓</span>
                  <span>Tu nombre en el registro: {orderData.name}</span>
                </p>
              </div>

              {/* CTAs */}
              <div className="space-y-3 pt-4">
                <Button
                  onClick={handleWhatsApp}
                  variant="hero"
                  size="xl"
                  className="w-full h-14 text-base font-bold"
                >
                  Contactar por WhatsApp
                </Button>

                <Button
                  onClick={onClose}
                  variant="outline"
                  size="lg"
                  className="w-full h-12 text-sm font-semibold bg-secondary/50 hover:bg-secondary/80"
                >
                  Volver al inicio
                </Button>
              </div>

              {/* Extra Info */}
              <p className="text-xs text-muted-foreground">
                Te contactaremos pronto para coordinar la entrega. ¡Gracias por confiar en NOCTE<sup className="text-[0.3em]">®</sup>!
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
