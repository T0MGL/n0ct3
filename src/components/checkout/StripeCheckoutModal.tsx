import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { X } from 'lucide-react';
import { getStripe, formatPrice } from '@/lib/stripe';
import { Button } from '@/components/ui/button';
import { useStripePayment } from '@/hooks/useStripePayment';
import { trackAddPaymentInfo } from '@/lib/meta-pixel';
import { CheckoutProgressBar } from './CheckoutProgressBar';

interface StripeCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  onSuccess: (paymentIntentId: string) => void;
  amount: number;
  currency: string;
  customerData: {
    name: string;
    phone: string;
    location: string;
    address: string;
    orderNumber: string;
    quantity: number;
  };
}

const CheckoutForm = ({
  onSuccess,
  onClose,
  amount,
  currency,
  customerData,
}: Omit<StripeCheckoutModalProps, 'isOpen'>) => {
  const stripe = useStripe();
  const elements = useElements();
  const { createPaymentIntent } = useStripePayment();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setErrorMessage('Error al cargar el formulario de pago');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Create payment intent with customer data

      const response = await createPaymentIntent({
        amount,
        currency,
        paymentMethodId: 'pending',
        email: `${customerData.phone}@nocte.com.py`, // Generate email from phone
        metadata: {
          orderNumber: customerData.orderNumber,
          customerName: customerData.name,
          customerPhone: customerData.phone,
          deliveryLocation: customerData.location,
          deliveryAddress: customerData.address,
          quantity: customerData.quantity.toString(),
          product: customerData.quantity === 2
            ? 'NOCTE® Red Light Blocking Glasses - Pack x2'
            : 'NOCTE® Red Light Blocking Glasses',
        },
      });

      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        response.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: customerData.name,
              phone: customerData.phone,
              address: {
                country: 'PY',
                city: customerData.location,
                line1: customerData.address,
              },
            },
          },
        }
      );

      if (error) {
        setErrorMessage(error.message || 'Error al procesar el pago');
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded
        onSuccess(paymentIntent.id);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al procesar el pago';
      setErrorMessage(message);
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer Info Summary */}
      <div className="p-4 bg-secondary/20 rounded-lg border border-border/30 space-y-2">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Entrega para:</span> {customerData.name}
        </p>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Ubicación:</span> {customerData.location}
        </p>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Teléfono:</span> {customerData.phone}
        </p>
      </div>

      {/* Card Element */}
      <div className="p-4 bg-secondary/20 rounded-lg border border-border/30">
        <label className="block text-sm font-medium text-foreground mb-3">
          Información de la tarjeta
        </label>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#F9FAFB',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                '::placeholder': {
                  color: '#6B7280',
                },
              },
              invalid: {
                color: '#DC2626',
              },
            },
            hidePostalCode: true,
            disableLink: true, // CRITICAL: Disable Stripe Link
          }}
        />
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">{errorMessage}</p>
        </div>
      )}

      {/* Total */}
      <div className="flex justify-between items-center p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <span className="font-semibold text-foreground">Total a pagar:</span>
        <span className="text-2xl font-bold text-primary">
          {formatPrice(amount, currency)}
        </span>
      </div>

      {/* Buttons */}
      <div className="space-y-3">
        <Button
          type="submit"
          variant="hero"
          size="xl"
          className="w-full h-14"
          disabled={!stripe || isProcessing}
        >
          {isProcessing ? (
            <>
              <div className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Procesando pago...
            </>
          ) : (
            `Pagar ${formatPrice(amount, currency)}`
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full bg-transparent border-border/50 hover:bg-secondary/50"
          onClick={onClose}
          disabled={isProcessing}
        >
          Cancelar
        </Button>
      </div>

      {/* Security Info */}
      <div className="flex items-center justify-center gap-2 pt-2">
        <img
          src="https://cdn.brandfolder.io/KGT2DTA4/at/8vbr8k4mr5xjwk4hxq4t9vs/Stripe_wordmark_-_blurple.svg"
          alt="Powered by Stripe"
          className="h-4 opacity-70"
        />
        <p className="text-xs text-muted-foreground">
          Pago seguro y encriptado
        </p>
      </div>
    </form>
  );
};

export const StripeCheckoutModal = ({
  isOpen,
  onClose,
  onBack,
  onSuccess,
  amount,
  currency,
  customerData,
}: StripeCheckoutModalProps) => {
  const [stripePromise] = useState(() => getStripe());
  const [isInitializing, setIsInitializing] = useState(false);

  // Track AddPaymentInfo when modal opens
  useEffect(() => {
    if (isOpen) {
      trackAddPaymentInfo({
        value: amount,
        currency: currency.toUpperCase(),
        num_items: customerData.quantity,
      });
    }
  }, [isOpen, amount, currency, customerData.quantity]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[550px] bg-gradient-to-b from-secondary to-black border border-border/50 rounded-xl p-8 md:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] max-h-[90vh] overflow-y-auto"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Back Button */}
            <button
              onClick={onBack}
              className="absolute top-4 left-4 text-sm text-muted-foreground hover:text-foreground transition-colors z-10 flex items-center gap-1"
            >
              ← Volver
            </button>

            {/* Header */}
            <div className="mb-6 text-center pt-6 space-y-6">
              {/* Progress Bar */}
              <CheckoutProgressBar currentStep={3} />

              <div>
                <div className="inline-block px-3 py-1 bg-primary/10 border border-primary/20 rounded-md mb-4">
                  <p className="text-xs font-semibold text-primary tracking-wide">
                    PAGO SEGURO
                  </p>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  Finalizar Compra
                </h2>
                <p className="text-sm text-muted-foreground">
                  Orden #{customerData.orderNumber}
                </p>
              </div>
            </div>

            {/* Stripe Elements */}
            <Elements
              stripe={stripePromise}
              options={{
                locale: 'es',
                loader: 'never',
                appearance: {
                  theme: 'night',
                  variables: {
                    colorPrimary: '#EF4444',
                    colorBackground: '#1F2937',
                    colorText: '#F9FAFB',
                    colorDanger: '#DC2626',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontSizeBase: '16px',
                    borderRadius: '8px',
                  },
                },
              }}
            >
              <CheckoutForm
                onSuccess={onSuccess}
                onClose={onClose}
                onBack={onBack}
                amount={amount}
                currency={currency}
                customerData={customerData}
              />
            </Elements>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
