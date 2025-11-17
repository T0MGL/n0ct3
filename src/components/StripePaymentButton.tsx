import { useState, useEffect, useRef } from 'react';
import { PaymentRequest } from '@stripe/stripe-js';
import { getStripe, PRODUCT_CONFIG, formatPrice } from '@/lib/stripe';
import { useStripePayment } from '@/hooks/useStripePayment';
import { Button } from '@/components/ui/button';
import type { PaymentRequestEvent } from '@/types/stripe';

interface StripePaymentButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
  children?: React.ReactNode;
}

export const StripePaymentButton = ({
  onSuccess,
  onError,
  className,
  children = `Comprar Ahora - ${formatPrice(PRODUCT_CONFIG.price, PRODUCT_CONFIG.currency)}`,
}: StripePaymentButtonProps) => {
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [canMakePayment, setCanMakePayment] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const paymentButtonRef = useRef<HTMLDivElement>(null);
  const { createPaymentIntent } = useStripePayment();

  useEffect(() => {
    const initPaymentRequest = async () => {
      try {
        const stripe = await getStripe();
        if (!stripe) {
          console.warn('Stripe not initialized');
          return;
        }

        // Create payment request for Apple Pay/Google Pay
        // Country code for Paraguay (PY) - Stripe uses ISO 3166-1 alpha-2
        const countryCode = PRODUCT_CONFIG.currency.toLowerCase() === 'pyg' ? 'PY' : 'US';

        const pr = stripe.paymentRequest({
          country: countryCode,
          currency: PRODUCT_CONFIG.currency,
          total: {
            label: PRODUCT_CONFIG.name,
            amount: PRODUCT_CONFIG.price,
          },
          requestPayerName: true,
          requestPayerEmail: true,
          requestShipping: true,
          shippingOptions: [
            {
              id: 'standard',
              label: 'Envío Estándar',
              detail: '5-7 días hábiles',
              amount: 0,
            },
            {
              id: 'express',
              label: 'Envío Express',
              detail: '2-3 días hábiles',
              // Express shipping cost based on currency
              amount: PRODUCT_CONFIG.currency.toLowerCase() === 'pyg' ? 50000 : 1000,
            },
          ],
        });

        // Check if Apple Pay or Google Pay is available
        const canMake = await pr.canMakePayment();

        if (canMake) {
          setPaymentRequest(pr);
          setCanMakePayment(true);

          // Handle payment method submission (triggered after Face ID/Touch ID)
          pr.on('paymentmethod', async (ev: PaymentRequestEvent) => {
            setIsProcessing(true);

            try {
              if (!ev.payerEmail || !ev.shippingAddress) {
                ev.complete('fail');
                throw new Error('Email y dirección de envío son requeridos');
              }

              // Create payment intent on backend
              const response = await createPaymentIntent({
                amount: PRODUCT_CONFIG.price,
                currency: PRODUCT_CONFIG.currency,
                paymentMethodId: ev.paymentMethod.id,
                email: ev.payerEmail,
                shipping: {
                  name: ev.shippingAddress.recipient,
                  address: {
                    line1: ev.shippingAddress.addressLine[0] || '',
                    line2: ev.shippingAddress.addressLine[1],
                    city: ev.shippingAddress.city,
                    state: ev.shippingAddress.region,
                    postal_code: ev.shippingAddress.postalCode,
                    country: ev.shippingAddress.country,
                  },
                },
                metadata: {
                  product: PRODUCT_CONFIG.name,
                },
              });

              // Confirm payment with Stripe
              const { error: confirmError } = await stripe.confirmCardPayment(
                response.clientSecret,
                { payment_method: ev.paymentMethod.id },
                { handleActions: false }
              );

              if (confirmError) {
                ev.complete('fail');
                throw confirmError;
              }

              // Payment successful
              ev.complete('success');
              onSuccess?.();
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Error al procesar el pago';
              onError?.(errorMessage);
              console.error('Payment error:', error);
            } finally {
              setIsProcessing(false);
            }
          });

          // Handle shipping address change
          pr.on('shippingaddresschange', (ev) => {
            // Validate shipping address and update shipping options if needed
            ev.updateWith({
              status: 'success',
              shippingOptions: [
                {
                  id: 'standard',
                  label: 'Envío Estándar',
                  detail: '5-7 días hábiles',
                  amount: 0,
                },
                {
                  id: 'express',
                  label: 'Envío Express',
                  detail: '2-3 días hábiles',
                  amount: 1000,
                },
              ],
            });
          });
        }
      } catch (error) {
        console.error('Error initializing payment request:', error);
      }
    };

    initPaymentRequest();
  }, [createPaymentIntent, onSuccess, onError]);

  // Render Apple Pay/Google Pay button if available
  useEffect(() => {
    if (canMakePayment && paymentRequest && paymentButtonRef.current) {
      const elements = getStripe().then(async (stripe) => {
        if (!stripe) return;

        const elements = stripe.elements();
        const prButton = elements.create('paymentRequestButton', {
          paymentRequest,
          style: {
            paymentRequestButton: {
              type: 'buy',
              theme: 'dark',
              height: '56px',
            },
          },
        });

        // Mount the button
        prButton.mount(paymentButtonRef.current!);

        return () => prButton.destroy();
      });

      return () => {
        elements.then((cleanup) => cleanup?.());
      };
    }
  }, [canMakePayment, paymentRequest]);

  // Fallback: Show regular button if Apple Pay/Google Pay not available
  if (!canMakePayment) {
    return (
      <Button
        data-hero-cta
        variant="hero"
        size="xl"
        className={className}
        onClick={() => {
          onError?.('Apple Pay o Google Pay no están disponibles en este dispositivo');
        }}
        disabled={isProcessing}
      >
        {children}
      </Button>
    );
  }

  // Render Apple Pay/Google Pay button
  return (
    <div className={className} data-hero-cta>
      <div
        ref={paymentButtonRef}
        className="w-full"
        style={{ minHeight: '56px' }}
      />
      {isProcessing && (
        <div className="text-center text-sm text-foreground/60 mt-2">
          Procesando pago...
        </div>
      )}
    </div>
  );
};
