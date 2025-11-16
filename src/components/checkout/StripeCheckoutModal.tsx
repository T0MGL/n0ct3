import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { X } from 'lucide-react';
import { BanknotesIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { getStripe, formatPrice } from '@/lib/stripe';
import { Button } from '@/components/ui/button';
import { useStripePayment } from '@/hooks/useStripePayment';
import { trackAddPaymentInfo } from '@/lib/meta-pixel';

interface StripeCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  onSuccess: () => void;
  onPayOnDelivery: () => void;
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
  onBack,
  onSuccess,
  onPayOnDelivery,
  amount,
  currency,
}: StripeCheckoutModalProps) => {
  const [stripePromise] = useState(() => getStripe());
  const { createPaymentIntent } = useStripePayment();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [showStripeForm, setShowStripeForm] = useState(false);

  // Create payment intent when user selects digital payment
  useEffect(() => {
    if (isOpen && showStripeForm) {
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
    } else if (!isOpen) {
      // Reset when modal closes - force complete unmount
      setClientSecret(null);
      setInitError(null);
      setShowStripeForm(false);
    }
  }, [isOpen, showStripeForm, amount, currency, createPaymentIntent]);

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
            {!showStripeForm && (
              <button
                onClick={onBack}
                className="absolute top-4 left-4 text-sm text-muted-foreground hover:text-foreground transition-colors z-10 flex items-center gap-1"
              >
                ← Volver
              </button>
            )}

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

            {/* Payment Method Selection */}
            {!showStripeForm && (
              <div className="space-y-5">
                {/* Pago Digital - Recommended */}
                <div className="p-5 bg-primary/10 border-2 border-primary/50 rounded-xl space-y-3 relative overflow-hidden">
                  <div className="absolute top-2 right-2 px-2 py-1 bg-primary rounded-full">
                    <p className="text-xs font-bold text-white">RECOMENDADO</p>
                  </div>

                  <div className="flex items-start gap-3">
                    <CreditCardIcon className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-foreground mb-2">
                        Pago seguro con tarjeta
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Procesado por Stripe. Paga con Face ID, Google Pay, Apple Pay o cualquier tarjeta de débito/crédito.
                      </p>
                      <div className="space-y-1.5 mb-3">
                        <p className="text-xs text-foreground flex items-center gap-2">
                          ✓ Aceptamos Ueno, Itaú, Familiar, Vision, Rio
                        </p>
                        <p className="text-xs text-foreground flex items-center gap-2">
                          ✓ Delivery GRATIS incluido
                        </p>
                        <p className="text-xs text-foreground flex items-center gap-2">
                          ✓ Pago instantáneo y seguro
                        </p>
                        <p className="text-xs text-foreground flex items-center gap-2">
                          ✓ Confirmación inmediata por email
                        </p>
                        <p className="text-xs text-foreground flex items-center gap-2">
                          ✓ Protección de compra garantizada
                        </p>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-black/20 rounded-lg border border-primary/20">
                        <img
                          src="https://cdn.brandfolder.io/KGT2DTA4/at/8vbr8k4mr5xjwk4hxq4t9vs/Stripe_wordmark_-_blurple.svg"
                          alt="Powered by Stripe"
                          className="h-4 opacity-70"
                        />
                        <span className="text-[10px] text-muted-foreground">
                          Procesamiento seguro
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => setShowStripeForm(true)}
                    variant="hero"
                    size="lg"
                    className="w-full mt-3 font-bold"
                  >
                    Pagar con tarjeta ahora
                  </Button>
                </div>

                {/* Pagar al recibir - Alternative */}
                <div className="p-4 bg-secondary/30 border border-border rounded-lg">
                  <div className="flex items-start gap-3 mb-3">
                    <BanknotesIcon className="w-6 h-6 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-foreground mb-1">
                        Pago al recibir
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Paga en efectivo cuando recibas el producto
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={onPayOnDelivery}
                    variant="outline"
                    size="default"
                    className="w-full bg-secondary/50 hover:bg-secondary/80"
                  >
                    Continuar con pago al recibir
                  </Button>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <span className="font-semibold text-foreground">Total a pagar:</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatPrice(amount, currency)}
                  </span>
                </div>

                {/* Cancel Button */}
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full bg-transparent border-border/50 hover:bg-secondary/50"
                  onClick={onClose}
                >
                  Cancelar
                </Button>
              </div>
            )}

            {/* Stripe Payment Form */}
            {showStripeForm && (
              <>
                {/* Back Button */}
                <button
                  onClick={() => setShowStripeForm(false)}
                  className="mb-4 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                >
                  ← Volver a métodos de pago
                </button>

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
                      onClick={() => setShowStripeForm(false)}
                      variant="outline"
                      size="lg"
                      className="w-full bg-transparent border-border/50 hover:bg-secondary/50"
                    >
                      Volver
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
                      locale: 'es',
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
                      onClose={() => setShowStripeForm(false)}
                      amount={amount}
                      currency={currency}
                    />
                  </Elements>
                )}
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
