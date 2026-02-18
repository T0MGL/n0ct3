import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { XMarkIcon, CreditCardIcon, DevicePhoneMobileIcon, BanknotesIcon, CheckIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';
import { getStripe, formatPrice } from '@/lib/stripe';
import { Button } from '@/components/ui/button';
import { useStripePayment } from '@/hooks/useStripePayment';
import { trackAddPaymentInfo } from '@/lib/meta-pixel';
import { CheckoutProgressBar } from './CheckoutProgressBar';
import { lockScroll, unlockScroll } from '@/lib/scrollLock';

type PaymentMethod = 'card' | 'cash_on_delivery';

const PRIORITY_SHIPPING_COST = 10000;

export interface PaymentResult {
  paymentIntentId: string;
  paymentType: 'Card' | 'COD';
  isPaid: boolean;
  deliveryType: 'común' | 'premium';
  finalTotal: number;
}

interface StripeCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  onSuccess: (result: PaymentResult) => void;
  amount: number;
  currency: string;
  isProcessingOrder?: boolean;
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
  onCloseAttempt,
}: Omit<StripeCheckoutModalProps, 'isOpen'> & {
  onCloseAttempt: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_on_delivery');
  const [isPriorityShipping, setIsPriorityShipping] = useState(false);

  // Calculate final total including priority shipping
  const finalTotal = amount + (isPriorityShipping ? PRIORITY_SHIPPING_COST : 0);

  // Refs to track AddPaymentInfo events and prevent duplicates
  const initialTrackDoneRef = useRef(false);
  const previousPaymentMethodRef = useRef<PaymentMethod | null>(null);
  const submitButtonRef = useRef<HTMLDivElement>(null);

  // Scroll to submit button when user selects card payment
  useEffect(() => {
    if (paymentMethod === 'card' && submitButtonRef.current) {
      setTimeout(() => {
        submitButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 400);
    }
  }, [paymentMethod]);

  useEffect(() => {
    console.log('🔵 [CheckoutForm] Component mounted, stripe:', !!stripe, 'elements:', !!elements);
  }, [stripe, elements]);

  // Track AddPaymentInfo when user sees form and when they change payment method
  useEffect(() => {
    // First render: Track the default payment method ("Pago contra entrega")
    if (!initialTrackDoneRef.current) {
      console.log('📊 [Meta Pixel] Tracking AddPaymentInfo - Default: Pago contra entrega');
      trackAddPaymentInfo({
        value: finalTotal,
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
        value: finalTotal,
        currency: currency.toUpperCase(),
        num_items: customerData.quantity,
        payment_type: paymentType,
      });
      previousPaymentMethodRef.current = paymentMethod;
    }
  }, [paymentMethod, amount, currency, customerData.quantity, finalTotal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('🔵 [Payment] Starting payment submission...', { paymentMethod, isPriorityShipping, finalTotal });

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Handle Cash on Delivery
      if (paymentMethod === 'cash_on_delivery') {
        console.log('🔵 [Payment] Processing Cash on Delivery order...');

        // Generate a COD order ID - Append PRIORITY tag if selected
        let codOrderId = `COD-${customerData.orderNumber}-${Date.now()}`;
        if (isPriorityShipping) {
          codOrderId += '-PRIORITY';
        }

        console.log('✅ [Payment] Cash on Delivery order created:', codOrderId);

        // Simulate async processing
        await new Promise(resolve => setTimeout(resolve, 1000));

        onSuccess({
          paymentIntentId: codOrderId,
          paymentType: 'COD',
          isPaid: false,
          deliveryType: isPriorityShipping ? 'premium' : 'común',
          finalTotal,
        });
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
        onSuccess({
          paymentIntentId: paymentIntent.id,
          paymentType: 'Card',
          isPaid: true,
          deliveryType: isPriorityShipping ? 'premium' : 'común',
          finalTotal,
        });
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
          <div className="relative rounded-lg">
            {paymentMethod !== 'card' && (
              <svg
                viewBox="0 0 100 78"
                className="absolute inset-0 w-full h-full pointer-events-none"
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="1" y="1"
                  width="98" height="76"
                  rx="5"
                  fill="none"
                  stroke="rgba(239, 68, 68, 0.55)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeDasharray="12 400"
                  className="animate-border-travel"
                />
              </svg>
            )}
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`
                relative w-full p-4 rounded-lg transition-colors duration-300
                ${paymentMethod === 'card'
                  ? 'border-2 border-primary bg-primary/10 shadow-lg'
                  : 'border border-border/30 bg-secondary/30 hover:bg-secondary/50'
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
                Aceptamos efectivo, QR o transferencia al momento de la entrega. Total: {formatPrice(finalTotal, currency)}
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
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground leading-tight">
              {customerData.quantity === 2
                ? 'Lentes Rojos Premium Anti-Luz Azul - Pack x2'
                : 'Lentes Rojos Premium Anti-Luz Azul'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Cantidad: {customerData.quantity}
            </p>
          </div>
          <p className="text-sm font-semibold whitespace-nowrap flex-shrink-0 text-foreground">
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

        {/* PRIORITY SHIPPING UPSELL */}
        <div
          onClick={() => setIsPriorityShipping(!isPriorityShipping)}
          className={`
            relative p-4 rounded-xl border cursor-pointer transition-all duration-300 group
            ${isPriorityShipping
              ? 'bg-primary/5 border-primary/40 shadow-[0_0_20px_-10px_rgba(239,68,68,0.3)]'
              : 'bg-secondary/30 border-border/40 hover:bg-secondary/50 hover:border-border/60'
            }
          `}
        >
          <div className="flex items-start gap-3">
            {/* Checkbox */}
            <div className={`
              w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 flex-shrink-0 mt-0.5
              ${isPriorityShipping
                ? 'bg-primary border-primary scale-110'
                : 'border-muted-foreground/40 group-hover:border-primary/50'
              }
            `}>
              {isPriorityShipping && <CheckIcon className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Title Row */}
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <p className={`text-sm font-bold ${isPriorityShipping ? 'text-primary' : 'text-foreground'}`}>
                    Envío Prioritario VIP
                  </p>
                  <RocketLaunchIcon className={`w-4 h-4 flex-shrink-0 ${isPriorityShipping ? 'text-primary' : 'text-muted-foreground/70'}`} />
                </div>
                <p className={`text-sm font-bold whitespace-nowrap ml-2 ${isPriorityShipping ? 'text-primary' : 'text-muted-foreground'}`}>
                  + Gs. 10.000
                </p>
              </div>

              {/* Description */}
              <p className="text-xs text-muted-foreground leading-relaxed">
                Despacho inmediato en 24hs
              </p>
            </div>
          </div>
        </div>

        {/* Total */}
        <div className="flex justify-between items-center gap-3 pt-3 border-t border-border/50">
          <span className="text-base md:text-lg font-bold text-foreground">Total a pagar</span>
          <span className="text-xl md:text-2xl font-bold text-primary whitespace-nowrap">
            {formatPrice(finalTotal, currency)}
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
      <div ref={submitButtonRef} className="space-y-3">
        <Button
          type="submit"
          variant="hero"
          size="xl"
          className="w-full h-14 text-sm md:text-base"
          disabled={paymentMethod === 'card' ? (!stripe || isProcessing) : isProcessing}
        >
          {isProcessing ? (
            <>
              <div className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Procesando pedido...
            </>
          ) : (
            <span className="truncate">
              Confirmar Pedido - {formatPrice(finalTotal, currency)}
            </span>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full bg-transparent border-border/50 hover:bg-secondary/50"
          onClick={onCloseAttempt}
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
  isProcessingOrder = false,
  customerData,
}: StripeCheckoutModalProps) => {
  const [stripePromise] = useState(() => getStripe());
  const { createPaymentIntent } = useStripePayment();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [hasShownExitOffer, setHasShownExitOffer] = useState(false);

  // Intercept close attempt - show WhatsApp help if not shown yet
  const handleCloseAttempt = () => {
    if (!hasShownExitOffer) {
      setShowExitConfirm(true);
      setHasShownExitOffer(true);
    } else {
      onClose();
    }
  };

  // User contacts via WhatsApp
  const handleWhatsAppContact = () => {
    const phone = "595991893587";
    const message = encodeURIComponent(
      `Hola! Estaba por comprar NOCTE pero tengo algunas dudas. Mi orden: ${customerData.orderNumber}`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    setShowExitConfirm(false);
  };

  // User continues without help
  const handleContinueCheckout = () => {
    setShowExitConfirm(false);
  };

  // User exits
  const handleExit = () => {
    setShowExitConfirm(false);
    onClose();
  };

  // Create PaymentIntent when modal opens
  useEffect(() => {
    // Track if effect is still mounted to prevent state updates after unmount
    let isMounted = true;

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
          // Only update state if component is still mounted
          if (!isMounted) {
            console.log('⚠️ [Init] Component unmounted, skipping state update');
            return;
          }

          console.log('✅ [Init] Payment intent created successfully:', {
            paymentIntentId: response.paymentIntentId,
            hasClientSecret: !!response.clientSecret
          });

          setClientSecret(response.clientSecret);
          setIsInitializing(false);
        })
        .catch((error) => {
          // Only update state if component is still mounted
          if (!isMounted) {
            console.log('⚠️ [Init] Component unmounted, skipping error state update');
            return;
          }

          console.error('❌ [Init] Failed to create payment intent:', error);
          setInitError(error.message || 'Error al inicializar el pago');
          setIsInitializing(false);
        });
    }

    // Cleanup function: mark as unmounted when effect re-runs or component unmounts
    return () => {
      isMounted = false;
    };
  }, [isOpen, clientSecret, amount, currency, customerData, createPaymentIntent]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setClientSecret(null);
      setInitError(null);
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open (iOS-safe, ref-counted)
  useEffect(() => {
    if (!isOpen) return;
    lockScroll();
    return () => { unlockScroll(); };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 touch-none"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[550px] bg-gradient-to-b from-secondary to-black border border-border/50 rounded-xl p-8 md:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] max-h-[90dvh] overflow-y-auto overscroll-contain touch-auto"
          >
            {/* Close Button */}
            <button
              onClick={handleCloseAttempt}
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
                  Orden {customerData.orderNumber}
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
                    onCloseAttempt={handleCloseAttempt}
                  />
                </Elements>
              </>
            )}

            {/* Exit WhatsApp Help Overlay */}
            <AnimatePresence>
              {showExitConfirm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 p-6 rounded-xl backdrop-blur-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-center space-y-5 max-w-md w-full">
                    {/* Headline */}
                    <div className="space-y-3">
                      <div className="w-16 h-16 mx-auto bg-green-500/10 rounded-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
                        ¿Necesitás ayuda para completar tu compra?
                      </h2>
                      <p className="text-base text-muted-foreground leading-relaxed px-2">
                        Nuestro equipo está disponible por WhatsApp para resolver tus dudas al instante.
                        <span className="block mt-2 text-foreground font-medium">
                          Respondemos en menos de 2 minutos 🇵🇾
                        </span>
                      </p>
                    </div>

                    {/* Benefits of contacting */}
                    <div className="text-left space-y-2 bg-secondary/30 border border-border/30 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>Resolvemos todas tus dudas sobre el producto</span>
                      </p>
                      <p className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>Te ayudamos a completar tu pedido paso a paso</span>
                      </p>
                      <p className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>Atención personalizada en español 🇵🇾</span>
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 space-y-3">
                      <Button
                        type="button"
                        variant="hero"
                        size="xl"
                        className="w-full h-14 text-base font-semibold bg-green-500 hover:bg-green-600"
                        onClick={handleWhatsAppContact}
                      >
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        Hablar por WhatsApp
                      </Button>
                      <button
                        type="button"
                        onClick={handleContinueCheckout}
                        className="w-full text-sm font-medium text-foreground hover:text-primary transition-colors py-2 underline"
                      >
                        Continuar sin ayuda
                      </button>
                      <button
                        type="button"
                        onClick={handleExit}
                        className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                      >
                        Salir
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Processing Order Overlay */}
            <AnimatePresence>
              {isProcessingOrder && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[60] flex items-center justify-center bg-black/95 p-6 rounded-xl backdrop-blur-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-center space-y-4 max-w-sm w-full">
                    <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                    <h3 className="text-xl md:text-2xl font-bold text-white">Procesando tu pedido...</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      Estamos confirmando tu orden y enviando los detalles. Esto tomará solo unos segundos.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StripeCheckoutModal;
