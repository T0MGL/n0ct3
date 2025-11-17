import { useState, useCallback } from 'react';
import { getStripe, API_CONFIG } from '@/lib/stripe';
import type { PaymentData, PaymentIntentResponse } from '@/types/stripe';

interface UseStripePaymentReturn {
  createPaymentIntent: (data: PaymentData) => Promise<PaymentIntentResponse>;
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
      console.log('🔵 Creating payment intent:', { url, data });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('🔴 Payment intent creation failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          requestData: data,
        });
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

  return {
    createPaymentIntent,
    loading,
    error,
    clearError,
  };
};
