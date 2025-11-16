import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { X } from 'lucide-react';
import { getStripe, formatPrice } from '@/lib/stripe';
import { Button } from '@/components/ui/button';
import { useStripePayment } from '@/hooks/useStripePayment';
import { trackAddPaymentInfo } from '@/lib/meta-pixel';

interface StripeCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  amount: number;
  currency: string;
}

const CheckoutForm = ({
  onSuccess,
  onClose,
  amount,
  currency,
}: Omit<StripeCheckoutModalProps, 'isOpen'>) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Initialize Payment Request (Apple Pay/Google Pay) - DISABLED for now
  // Using PaymentElement instead which handles both native and card payments
  // TODO: Re-enable if needed for explicit Apple Pay/Google Pay buttons

  // Auto-submit when payment details are complete
  useEffect(() => {
    if (!elements || !stripe || isProcessing) return;

    const paymentElement = elements.getElement('payment');
    if (!paymentElement) return;

    // Listen for changes in the payment element
    const handleChange = (event: { complete?: boolean }) => {
      if (event.complete && !isProcessing) {
        // Payment details are complete, auto-submit
        formRef.current?.requestSubmit();
      }
    };

    paymentElement.on('change', handleChange);

    return () => {
      paymentElement.off('change', handleChange);
    };
  }, [elements, stripe, isProcessing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}?payment=success`,
          payment_method_data: {
            billing_details: {
              name: 'Customer',
              email: 'customer@nocte.studio',
              phone: '+595123456789',
              address: {
                country: 'US',
                postal_code: '00000',
              },
            },
          },
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message || 'Error al procesar el pago');
        setIsProcessing(false);
      } else {
        // Payment succeeded
        onSuccess();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al procesar el pago';
      setErrorMessage(message);
      setIsProcessing(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Element - handles both native wallets and cards */}
      <div className="p-4 bg-secondary/20 rounded-lg border border-border/30">
        <PaymentElement
          options={{
            layout: 'tabs',
            wallets: {
              applePay: 'auto',
              googlePay: 'auto',
            },
            fields: {
              billingDetails: 'never'
            },
            // Disable Link checkout
            paymentMethodOrder: ['card', 'apple_pay', 'google_pay']
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
              Procesando...
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
      <p className="text-xs text-center text-muted-foreground">
        Pago seguro procesado por Stripe. Tus datos están protegidos.
      </p>
    </form>
  );
};

export const StripeCheckoutModal = ({
  isOpen,
  onClose,
  onSuccess,
  amount,
  currency,
}: StripeCheckoutModalProps) => {
  const [stripePromise] = useState(() => getStripe());
  const { createPaymentIntent } = useStripePayment();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Create payment intent when modal opens
  useEffect(() => {
    if (isOpen) {
      const initPayment = async () => {
        setIsInitializing(true);
        setInitError(null);
        setClientSecret(null); // Force reset

        try {
          const response = await createPaymentIntent({
            amount,
            currency,
            paymentMethodId: 'pending',
            email: 'customer@placeholder.com',
            metadata: {
              quantity: '1',
              product: 'NOCTE Red-Tinted Glasses',
            },
          });

          setClientSecret(response.clientSecret);

          // Track AddPaymentInfo when payment form is ready
          trackAddPaymentInfo({
            value: amount,
            currency: currency.toUpperCase(),
            num_items: 1,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error al inicializar el pago';
          setInitError(message);
          console.error('Error creating payment intent:', error);
        } finally {
          setIsInitializing(false);
        }
      };

      initPayment();
    } else {
      // Reset when modal closes - force complete unmount
      setClientSecret(null);
      setInitError(null);
    }
  }, [isOpen, amount, currency, createPaymentIntent]);

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

            {/* Header */}
            <div className="mb-6 text-center">
              <div className="inline-block px-3 py-1 bg-primary/10 border border-primary/20 rounded-md mb-4">
                <p className="text-xs font-semibold text-primary tracking-wide">
                  CHECKOUT SEGURO
                </p>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Finalizar Compra
              </h2>
              <p className="text-sm text-muted-foreground">
                NOCTE® Red-Tinted Glasses
              </p>
            </div>

            {/* Loading State */}
            {isInitializing && (
              <div className="py-12 text-center">
                <div className="inline-block w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="mt-4 text-muted-foreground">Preparando pago...</p>
              </div>
            )}

            {/* Error State */}
            {initError && (
              <div className="space-y-4">
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-400">{initError}</p>
                </div>
                <Button
                  onClick={onClose}
                  variant="outline"
                  size="lg"
                  className="w-full bg-transparent border-border/50 hover:bg-secondary/50"
                >
                  Cerrar
                </Button>
              </div>
            )}

            {/* Stripe Elements */}
            {!isInitializing && !initError && clientSecret && (
              <Elements
                key={clientSecret}
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'night',
                    variables: {
                      colorPrimary: '#EF4444',
                      colorBackground: '#000000',
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
                  amount={amount}
                  currency={currency}
                />
              </Elements>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
