import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { XMarkIcon, CreditCardIcon, DevicePhoneMobileIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import { getStripe, formatPrice } from '@/lib/stripe';
import { Button } from '@/components/ui/button';
import { useStripePayment } from '@/hooks/useStripePayment';
import { trackAddPaymentInfo } from '@/lib/meta-pixel';
import { CheckoutProgressBar } from './CheckoutProgressBar';

type PaymentMethod = 'card' | 'cash_on_delivery';

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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_on_delivery');

  // Refs to track AddPaymentInfo events and prevent duplicates
  const initialTrackDoneRef = useRef(false);
  const previousPaymentMethodRef = useRef<PaymentMethod | null>(null);

  useEffect(() => {
    console.log('🔵 [CheckoutForm] Component mounted, stripe:', !!stripe, 'elements:', !!elements);
  }, [stripe, elements]);

  // Track AddPaymentInfo when user sees form and when they change payment method
  useEffect(() => {
    // First render: Track the default payment method ("Pago contra entrega")
    if (!initialTrackDoneRef.current) {
      console.log('📊 [Meta Pixel] Tracking AddPaymentInfo - Default: Pago contra entrega');
      trackAddPaymentInfo({
        value: amount,
        currency: currency.toUpperCase(),
        num_items: customerData.quantity,
        payment_type: 'Pago contra entrega',
      });
      initialTrackDoneRef.current = true;
      previousPaymentMethodRef.current = paymentMethod;
      return;
    }

    // Subsequent renders: Track only when user manually changes payment method
    if (previousPaymentMethodRef.current !== paymentMethod) {
      const paymentType = paymentMethod === 'cash_on_delivery' ? 'Pago contra entrega' : 'Tarjeta';
      console.log(`📊 [Meta Pixel] Tracking AddPaymentInfo - User changed to: ${paymentType}`);
      trackAddPaymentInfo({
        value: amount,
        currency: currency.toUpperCase(),
        num_items: customerData.quantity,
        payment_type: paymentType,
      });
      previousPaymentMethodRef.current = paymentMethod;
    }
  }, [paymentMethod, amount, currency, customerData.quantity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('🔵 [Payment] Starting payment submission...', { paymentMethod });

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Handle Cash on Delivery
      if (paymentMethod === 'cash_on_delivery') {
        console.log('🔵 [Payment] Processing Cash on Delivery order...');

        // Generate a COD order ID
        const codOrderId = `COD-${customerData.orderNumber}-${Date.now()}`;

        console.log('✅ [Payment] Cash on Delivery order created:', codOrderId);

        // Simulate async processing
        await new Promise(resolve => setTimeout(resolve, 1000));

        onSuccess(codOrderId);
        return;
      }

      // Handle Stripe payment (card, Apple Pay, Google Pay)
      if (!stripe || !elements) {
        console.error('❌ [Payment] Stripe or Elements not initialized');
        setErrorMessage('Error al inicializar el sistema de pago');
        setIsProcessing(false);
        return;
      }

      console.log('🔵 [Payment] Confirming payment with Stripe...');

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
                postal_code: '0000',
                country: 'PY',
              },
            },
          },
        },
        redirect: 'if_required',
      });

      console.log('🔵 [Payment] Stripe response received:', {
        hasError: !!error,
        paymentIntentStatus: paymentIntent?.status,
        errorMessage: error?.message
      });

      if (error) {
        console.error('❌ [Payment] Payment failed:', error);
        setErrorMessage(error.message || 'Error al procesar el pago');
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded
        console.log('✅ [Payment] Payment succeeded:', paymentIntent.id);
        onSuccess(paymentIntent.id);
      } else {
        console.warn('⚠️ [Payment] Unexpected payment status:', paymentIntent?.status);
        setErrorMessage(`Estado de pago inesperado: ${paymentIntent?.status}`);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('❌ [Payment] Exception during payment:', error);
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
          <span className="font-semibold text-foreground">Dirección:</span> {customerData.location}
        </p>
      </div>

      {/* Payment Method Selection */}
      <div className="p-5 bg-secondary/20 rounded-lg border border-border/30">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide border-b border-border/30 pb-2 mb-4">
          Método de pago
        </h3>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Cash on Delivery Option - NOW FIRST */}
          <button
            type="button"
            onClick={() => setPaymentMethod('cash_on_delivery')}
            className={`
              relative p-4 rounded-lg border-2 transition-all duration-300
              ${paymentMethod === 'cash_on_delivery'
                ? 'border-primary bg-primary/10 shadow-lg'
                : 'border-border/50 bg-secondary/30 hover:border-border hover:bg-secondary/50'
              }
            `}
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <BanknotesIcon className="w-6 h-6 text-primary" />
              <div>
                <p className={`text-sm font-semibold ${paymentMethod === 'cash_on_delivery' ? 'text-primary' : 'text-foreground'}`}>
                  Pagar al Recibir
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Efectivo / QR / Transferencia
                </p>
              </div>
            </div>
            {paymentMethod === 'cash_on_delivery' && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>

          {/* Card / Digital Wallets Option - NOW SECOND */}
          <button
            type="button"
            onClick={() => setPaymentMethod('card')}
            className={`
              relative p-4 rounded-lg border-2 transition-all duration-300
              ${paymentMethod === 'card'
                ? 'border-primary bg-primary/10 shadow-lg'
                : 'border-border/50 bg-secondary/30 hover:border-border hover:bg-secondary/50'
              }
            `}
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex items-center gap-2">
                <CreditCardIcon className="w-5 h-5 text-primary" />
                <DevicePhoneMobileIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className={`text-sm font-semibold ${paymentMethod === 'card' ? 'text-primary' : 'text-foreground'}`}>
                  Tarjeta de Crédito / Débito
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Apple Pay, Google Pay
                </p>
              </div>
            </div>
            {paymentMethod === 'card' && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Payment Element - Only show for card payments */}
      {paymentMethod === 'card' && (
        <div className="p-5 bg-secondary/20 rounded-lg border border-border/30">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide border-b border-border/30 pb-2 mb-4">
            Detalles de pago
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
                  address: {
                    country: 'never',
                    postalCode: 'never',
                  },
                },
              },
              defaultValues: {
                billingDetails: {
                  name: customerData.name,
                  address: {
                    country: 'PY',
                    city: customerData.location,
                  },
                },
              },
              wallets: {
                applePay: 'auto',
                googlePay: 'auto',
              },
              terms: {
                card: 'never',
              },
            }}
          />
        </div>
      )}

      {/* Cash on Delivery Info */}
      {paymentMethod === 'cash_on_delivery' && (
        <div className="p-5 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-start gap-3">
            <BanknotesIcon className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">
                Pagas recién cuando tienes el producto en mano
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Aceptamos efectivo, QR o transferencia al momento de la entrega. Total: {formatPrice(amount, currency)}
              </p>
            </div>
          </div>
        </div>
      )}

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
                ? 'Lentes Rojos Premium Anti-Luz Azul - Pack x2'
                : 'Lentes Rojos Premium Anti-Luz Azul'}
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
            Gs. 30.000
          </p>
        </div>

        {/* Total */}
        <div className="flex justify-between items-center pt-3 border-t border-border/50">
          <span className="text-lg font-bold text-foreground">Total a pagar</span>
          <span className="text-2xl font-bold text-primary">
            {formatPrice(amount, currency)}
          </span>
        </div>

        {/* Trust Microcopy */}
        <div className="flex justify-center pt-2">
          <p className="text-xs text-gray-400">
            Envío seguro a todo Paraguay 🇵🇾
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div className="space-y-3">
        <Button
          type="submit"
          variant="hero"
          size="xl"
          className="w-full h-14"
          disabled={paymentMethod === 'card' ? (!stripe || isProcessing) : isProcessing}
        >
          {isProcessing ? (
            <>
              <div className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Procesando pedido...
            </>
          ) : (
            `Confirmar Pedido - ${formatPrice(amount, currency)}`
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
      console.log('🔵 [Init] Creating payment intent...', {
        amount,
        currency,
        customerData: customerData.name
      });

      setIsInitializing(true);
      setInitError(null);

      createPaymentIntent({
        amount,
        currency,
        paymentMethodId: 'pending',
        email: 'customer@nocte.studio',
        metadata: {
          orderNumber: customerData.orderNumber,
          customerName: customerData.name,
          customerPhone: customerData.phone,
          deliveryLocation: customerData.location,
          deliveryAddress: customerData.address,
          quantity: customerData.quantity.toString(),
          product: customerData.quantity === 2
            ? 'Lentes Rojos Premium Anti-Luz Azul - Pack x2'
            : 'Lentes Rojos Premium Anti-Luz Azul',
        },
      })
        .then((response) => {
          console.log('✅ [Init] Payment intent created successfully:', {
            paymentIntentId: response.paymentIntentId,
            hasClientSecret: !!response.clientSecret
          });

          setClientSecret(response.clientSecret);
          setIsInitializing(false);
        })
        .catch((error) => {
          console.error('❌ [Init] Failed to create payment intent:', error);
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
              <XMarkIcon className="w-5 h-5" />
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
              <CheckoutProgressBar currentStep={2} />

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
              <>
                {console.log('🔵 [Elements] Rendering Stripe Elements with clientSecret:', clientSecret.substring(0, 20) + '...')}
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
                    onBack={onBack}
                    amount={amount}
                    currency={currency}
                    customerData={customerData}
                  />
                </Elements>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StripeCheckoutModal;
