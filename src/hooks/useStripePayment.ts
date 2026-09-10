import { useState, useCallback } from 'react';
import { getStripe, API_CONFIG } from '@/lib/stripe';
import type { PaymentData, PaymentIntentResponse } from '@/types/stripe';

/**
 * Falla al reajustar el monto del pago. `isTerminal` marca el caso sin
 * reintento posible: el intent quedo trabado (por ejemplo un 3DS abandonado,
 * que lo deja en requires_action) y solo se destraba reiniciando el pago.
 */
export class PaymentAmountError extends Error {
  isTerminal = false;
}

interface UseStripePaymentReturn {
  createPaymentIntent: (data: PaymentData) => Promise<PaymentIntentResponse>;
  updatePaymentIntentAmount: (
    paymentIntentId: string,
    amount: number,
    clientSecret: string,
  ) => Promise<void>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Custom hook for managing Stripe payments
 * Handles payment intent creation and error states
 */
export const useStripePayment = (): UseStripePaymentReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const createPaymentIntent = useCallback(async (data: PaymentData): Promise<PaymentIntentResponse> => {
    setLoading(true);
    setError(null);

    try {
      // Validate Stripe is available
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error('Stripe is not configured. Please check your API keys.');
      }

      // Call backend to create payment intent
      const url = `${API_CONFIG.baseUrl}/api/create-payment-intent`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (import.meta.env.DEV) {
          console.error('Payment intent creation failed:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
          });
        }
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result: PaymentIntentResponse = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Reajusta el monto de un PaymentIntent ya creado. Hace falta porque el
   * intent nace al abrir el modal, con el precio del producto solo, y los
   * upsells se eligen despues. Rechaza si el servidor no confirma: quien la
   * llama tiene que cortar el pago, nunca seguir y cobrar distinto.
   *
   * El clientSecret viaja como prueba de que quien pide el cambio es el dueño
   * de este checkout. Los `pi_...` circulan por Ordefy, n8n y los logs; el
   * secret no sale de esta sesion.
   */
  const updatePaymentIntentAmount = useCallback(
    async (paymentIntentId: string, amount: number, clientSecret: string): Promise<void> => {
      const response = await fetch(`${API_CONFIG.baseUrl}/api/update-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Sin currency: el servidor toma la del intent, nunca la que le manden.
        body: JSON.stringify({ paymentIntentId, amount, clientSecret }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        // 409 es el intent trabado (un 3DS abandonado lo deja en
        // requires_action y de ahi no acepta cambio de monto nunca mas). Se
        // marca para que el checkout no invite a reintentar en vano.
        const error = new PaymentAmountError(data.error || `HTTP error! status: ${response.status}`);
        error.isTerminal = response.status === 409;
        throw error;
      }
    },
    [],
  );

  return {
    createPaymentIntent,
    updatePaymentIntentAmount,
    loading,
    error,
    clearError,
  };
};
