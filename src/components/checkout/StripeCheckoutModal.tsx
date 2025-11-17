import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Confirm payment using PaymentElement
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
          payment_method_data: {
            billing_details: {
              name: customerData.name,
              phone: customerData.phone,
              address: {
                line1: customerData.address,
                city: customerData.location,
                country: 'PY',
              },
            },
          },
        },
        redirect: 'if_required',
      });

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
      <div className="p-5 bg-secondary/20 rounded-lg border border-border/30 space-y-3">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide border-b border-border/30 pb-2 mb-3">
          Información de entrega
        </h3>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Nombre:</span> {customerData.name}
        </p>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Teléfono:</span> {customerData.phone}
        </p>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Ciudad:</span> {customerData.location}
        </p>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Referencia:</span> {customerData.address}
        </p>
      </div>

      {/* Payment Element - Supports cards, Apple Pay, Google Pay, Link, etc. */}
      <div className="p-5 bg-secondary/20 rounded-lg border border-border/30">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide border-b border-border/30 pb-2 mb-4">
          Método de pago
        </h3>

        <PaymentElement
          options={{
            layout: {
              type: 'tabs',
              defaultCollapsed: false,
            },
            fields: {
              billingDetails: {
                name: 'never',
                phone: 'never',
                address: 'never',
              },
            },
            terms: {
              card: 'never',
            },
          }}
        />
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">{errorMessage}</p>
        </div>
      )}

      {/* Order Summary */}
      <div className="p-5 bg-secondary/20 rounded-lg border border-border/30 space-y-4">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide border-b border-border/30 pb-2">
          Resumen del pedido
        </h3>

        {/* Product */}
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              {customerData.quantity === 2
                ? 'NOCTE® Red Light Blocking Glasses - Pack x2'
                : 'NOCTE® Red Light Blocking Glasses'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Cantidad: {customerData.quantity}
            </p>
          </div>
          <p className="text-sm font-semibold text-foreground ml-4">
            {formatPrice(amount, currency)}
          </p>
        </div>

        {/* Delivery */}
        <div className="flex justify-between items-center pt-2 border-t border-border/30">
          <div className="flex items-center gap-2">
            <p className="text-sm text-foreground">Delivery</p>
            <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 rounded text-xs font-semibold text-primary">
              GRATIS
            </span>
          </div>
          <p className="text-sm font-semibold text-muted-foreground line-through">
            {formatPrice(0, currency)}
          </p>
        </div>

        {/* Total */}
        <div className="flex justify-between items-center pt-3 border-t border-border/50">
          <span className="text-base font-bold text-foreground">Total a pagar</span>
          <span className="text-2xl font-bold text-primary">
            {formatPrice(amount, currency)}
          </span>
        </div>
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
  const { createPaymentIntent } = useStripePayment();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Create PaymentIntent when modal opens
  useEffect(() => {
    if (isOpen && !clientSecret) {
      setIsInitializing(true);
      setInitError(null);

      createPaymentIntent({
        amount,
        currency,
        paymentMethodId: 'pending',
        email: `${customerData.phone}@nocte.com.py`,
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
      })
        .then((response) => {
          setClientSecret(response.clientSecret);
          setIsInitializing(false);

          // Track AddPaymentInfo
          trackAddPaymentInfo({
            value: amount,
            currency: currency.toUpperCase(),
            num_items: customerData.quantity,
          });
        })
        .catch((error) => {
          setInitError(error.message || 'Error al inicializar el pago');
          setIsInitializing(false);
        });
    }
  }, [isOpen, clientSecret, amount, currency, customerData, createPaymentIntent]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setClientSecret(null);
      setInitError(null);
    }
  }, [isOpen]);

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

            {/* Loading or Error State */}
            {isInitializing && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">
                  Preparando método de pago...
                </p>
              </div>
            )}

            {initError && (
              <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-400 text-center">{initError}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full mt-4 bg-transparent border-border/50 hover:bg-secondary/50"
                  onClick={onClose}
                >
                  Cerrar
                </Button>
              </div>
            )}

            {/* Stripe Elements */}
            {!isInitializing && !initError && clientSecret && (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
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
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
