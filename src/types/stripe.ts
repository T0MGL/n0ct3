import { PaymentRequest, PaymentMethod } from '@stripe/stripe-js';

/**
 * Payment data required to create a payment intent
 */
export interface PaymentData {
  email: string;
  amount: number;
  currency: string;
  paymentMethodId: string;
  shipping?: ShippingAddress;
  metadata?: Record<string, string>;
}

/**
 * Shipping address structure
 */
export interface ShippingAddress {
  name: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

/**
 * Payment intent response from backend
 */
export interface PaymentIntentResponse {
  clientSecret: string;
  status: string;
  error?: string;
}

/**
 * Payment request event data
 */
export interface PaymentRequestEvent {
  paymentMethod: PaymentMethod;
  payerEmail: string | null;
  payerName: string | null;
  shippingAddress: {
    recipient: string;
    addressLine: string[];
    city: string;
    region: string;
    postalCode: string;
    country: string;
  } | null;
  complete: (status: 'success' | 'fail' | 'invalid_shipping_address') => void;
}

/**
 * Stripe payment state
 */
export interface StripePaymentState {
  loading: boolean;
  error: string | null;
  success: boolean;
  paymentRequest: PaymentRequest | null;
  canMakePayment: boolean;
}
