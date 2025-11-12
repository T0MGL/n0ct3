import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { PaymentRequest } from '@stripe/stripe-js';
import { X } from 'lucide-react';
import { getStripe, formatPrice } from '@/lib/stripe';
import { Button } from '@/components/ui/button';
import { useStripePayment } from '@/hooks/useStripePayment';
import type { PaymentRequestEvent } from '@/types/stripe';
import { trackAddPaymentInfo } from '@/lib/meta-pixel';

interface StripeCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  amount: number;
  currency: string;
  quantity: number;
}

const CheckoutForm = ({
  onSuccess,
  onClose,
  amount,
  currency,
  quantity
}: Omit<StripeCheckoutModalProps, 'isOpen'>) => {
  const stripe = useStripe();
  const elements = useElements();
  const { createPaymentIntent } = useStripePayment();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [canMakePayment, setCanMakePayment] = useState(false);
  const paymentButtonRef = useRef<HTMLDivElement>(null);
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
            layout: {
              type: 'accordion',
              defaultCollapsed: false,
              radios: false,
              spacedAccordionItems: true
            },
            wallets: {
              applePay: 'auto',
              googlePay: 'auto',
            },
            terms: {
              card: 'never'
            },
            defaultValues: {
              billingDetails: {
                address: {
                  country: 'PY'
                }
              }
            },
            fields: {
              billingDetails: {
                address: {
                  country: 'never'
                }
              }
            }
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
  quantity
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
              quantity: quantity.toString(),
              product: 'NOCTE Red-Tinted Glasses',
            },
          });

          setClientSecret(response.clientSecret);

          // Track AddPaymentInfo when payment form is ready
          trackAddPaymentInfo({
            value: amount,
            currency: currency.toUpperCase(),
            num_items: quantity,
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
  }, [isOpen, amount, currency, quantity, createPaymentIntent]);

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
                {quantity === 1 ? '1 NOCTE®' : `${quantity} NOCTE®`} Red-Tinted Glasses
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
                      colorTextSecondary: '#9CA3AF',
                      colorTextPlaceholder: '#6B7280',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      fontSizeBase: '16px',
                      fontWeightNormal: '400',
                      borderRadius: '8px',
                      spacingUnit: '4px',
                      colorIconTab: '#EF4444',
                      colorIconTabSelected: '#EF4444',
                      colorIconTabHover: '#DC2626',
                      colorLogo: 'dark',
                      focusBoxShadow: '0 0 0 1px #EF4444',
                      focusOutline: '#EF4444',
                    },
                    rules: {
                      '.Tab, .Block, .PickerItem': {
                        backgroundColor: '#0a0a0a',
                        borderColor: '#2a2a2a',
                        boxShadow: 'none',
                        color: '#F9FAFB',
                      },
                      '.Tab:hover, .PickerItem:hover': {
                        backgroundColor: '#0a0a0a',
                        borderColor: '#EF4444',
                        boxShadow: '0 0 0 1px #EF4444',
                        color: '#F9FAFB',
                      },
                      '.Tab--selected, .Tab--selected:hover': {
                        backgroundColor: '#0a0a0a',
                        borderColor: '#EF4444',
                        boxShadow: '0 0 0 2px #EF4444',
                        color: '#F9FAFB',
                      },
                      '.Input, .CodeInput, .PickerItem--selected': {
                        backgroundColor: '#000000',
                        borderColor: '#2a2a2a',
                        boxShadow: 'none',
                        color: '#F9FAFB',
                      },
                      '.Input:hover, .CodeInput:hover': {
                        backgroundColor: '#000000',
                        borderColor: '#3a3a3a',
                      },
                      '.Input:focus, .CodeInput:focus, .Input--invalid:focus': {
                        backgroundColor: '#000000',
                        borderColor: '#EF4444',
                        boxShadow: '0 0 0 1px #EF4444',
                        outline: 'none',
                      },
                      '.Label': {
                        color: '#F9FAFB',
                        fontWeight: '500',
                        fontSize: '14px',
                      },
                      '.Error': {
                        color: '#EF4444',
                      },
                      '.RedirectText': {
                        color: '#9CA3AF',
                      },
                      '.DropdownItem': {
                        backgroundColor: '#000000',
                        color: '#F9FAFB',
                      },
                      '.DropdownItem:hover': {
                        backgroundColor: '#1a1a1a',
                      },
                    },
                  },
                  loader: 'auto',
                }}
              >
                <CheckoutForm
                  onSuccess={onSuccess}
                  onClose={onClose}
                  amount={amount}
                  currency={currency}
                  quantity={quantity}
                />
              </Elements>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
