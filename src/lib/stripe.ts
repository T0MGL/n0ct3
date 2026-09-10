import { loadStripe, Stripe } from '@stripe/stripe-js';

// Get Stripe publishable key from environment variables
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey && import.meta.env.DEV) {
  console.warn('Stripe publishable key not found. Payment functionality will be disabled.');
}

// Singleton pattern for Stripe instance
let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Get or initialize Stripe instance
 * @returns Promise resolving to Stripe instance or null if key is missing
 */
export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePublishableKey) {
    return Promise.resolve(null);
  }

  if (!stripePromise) {
    stripePromise = loadStripe(stripePublishableKey);
  }

  return stripePromise;
};

/**
 * API configuration
 */
export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
};

/**
 * Format price for display
 * @param amount - Amount in smallest currency unit (cents for USD, guaraníes for PYG)
 * @param currency - Currency code (default: 'usd')
 * @returns Formatted price string
 */
export const formatPrice = (amount: number, currency: string = 'usd'): string => {
  const currencyUpper = currency.toUpperCase();

  // PYG (Paraguayan Guaraní) doesn't use decimal places
  // Most currencies use 2 decimal places (cents)
  const divisor = currencyUpper === 'PYG' ? 1 : 100;
  const finalAmount = amount / divisor;

  // For PYG, use es-PY locale for proper formatting
  const locale = currencyUpper === 'PYG' ? 'es-PY' : 'en-US';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyUpper,
      minimumFractionDigits: currencyUpper === 'PYG' ? 0 : 2,
      maximumFractionDigits: currencyUpper === 'PYG' ? 0 : 2,
    }).format(finalAmount);
  } catch (error) {
    // Fallback for unsupported currencies
    return `${currencyUpper} ${finalAmount.toLocaleString(locale)}`;
  }
};
