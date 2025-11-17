import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';
import { formatPrice, PRODUCT_CONFIG } from '@/lib/stripe';

interface PaymentSuccessModalProps {
  open: boolean;
  onClose: () => void;
  orderDetails?: {
    email?: string;
    amount?: number;
    currency?: string;
  };
}

export const PaymentSuccessModal = ({
  open,
  onClose,
  orderDetails,
}: PaymentSuccessModalProps) => {
  const getFormattedPrice = () => {
    if (orderDetails?.amount && orderDetails?.currency) {
      return formatPrice(orderDetails.amount, orderDetails.currency);
    }
    // Fallback to default product config
    return formatPrice(PRODUCT_CONFIG.price, PRODUCT_CONFIG.currency);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-secondary border border-gold/30 max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">Pago Exitoso</DialogTitle>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-6 py-4"
        >
          {/* Success Icon */}
          <div className="flex justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            >
              <CheckCircleIcon className="w-20 h-20 text-green-500" />
            </motion.div>
          </div>

          {/* Success Message */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              ¡Pago Exitoso!
            </h2>
            <p className="text-foreground/70 text-sm">
              Tu pedido ha sido confirmado
            </p>
          </div>

          {/* Order Details */}
          {orderDetails && (
            <div className="bg-black/30 rounded-lg p-4 space-y-3 border border-gold/20">
              {orderDetails.email && (
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/60">Email de confirmación:</span>
                  <span className="text-foreground font-medium truncate ml-2 max-w-[200px]">
                    {orderDetails.email}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-foreground/60">Total pagado:</span>
                <span className="text-primary font-bold text-lg">
                  {getFormattedPrice()}
                </span>
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="space-y-3 text-sm text-foreground/60 text-center">
            <p>
              Recibirás un email de confirmación con los detalles de tu pedido y el número de seguimiento.
            </p>
            <p className="text-xs">
              Tu pedido será procesado y enviado en las próximas 24-48 horas.
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-primary to-primary/80 text-white font-semibold py-3 px-6 rounded-lg hover:shadow-lg transition-all duration-300 active:scale-[0.98]"
          >
            Continuar
          </button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};
