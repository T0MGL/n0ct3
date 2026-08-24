/**
 * Order Service
 * Handles order data submission to backend
 * The backend handles routing to n8n and Ordefy
 */

import { API_CONFIG } from '@/lib/stripe';

export interface OrderData {
  name: string;
  phone: string;
  location: string;
  address?: string;
  lat?: number;
  long?: number;
  ruc?: string;
  quantity: number;
  total: number;
  orderNumber: string;
  paymentIntentId?: string;
  email?: string;
  paymentType: 'COD' | 'Cash' | 'Card';
  isPaid?: boolean;
  deliveryType: 'común' | 'premium';
  /** Lens color per unit in display order. Length should match quantity. */
  colors?: string[];
  /**
   * Raw _fbp/_fbc cookie values. The request is cross-origin without
   * credentials, so the cookies never reach api.nocte.studio on their own;
   * the server puts these on the Purchase user_data for attribution.
   */
  fbp?: string;
  fbc?: string;
}

export interface GeocodeResponse {
  googleMapsLink: string;
  address: string;
  lat?: number;
  lng?: number;
  usesFallback: boolean;
  error?: string;
}

export interface SendOrderResponse {
  success: boolean;
  message: string;
  orderNumber: string;
  /**
   * Present only when the server already sent the Purchase to Meta. The pixel
   * replays it under this id so Meta dedupes; absent means the legacy path.
   */
  purchaseEventId?: string;
  n8nResponse?: unknown;
  ordefyResponse?: unknown;
  error?: string;
}

/**
 * purchaseEventId is the one field the UI acts on, and a malformed value
 * would silently skip the legacy pixel. Read it strictly, keep the rest loose.
 */
const readSendOrderResponse = (raw: unknown, fallbackOrderNumber: string): SendOrderResponse => {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Partial<SendOrderResponse>;
  return {
    success: data.success === true,
    message: typeof data.message === 'string' ? data.message : '',
    orderNumber: typeof data.orderNumber === 'string' ? data.orderNumber : fallbackOrderNumber,
    purchaseEventId:
      typeof data.purchaseEventId === 'string' && data.purchaseEventId.length > 0
        ? data.purchaseEventId
        : undefined,
    n8nResponse: data.n8nResponse,
    ordefyResponse: data.ordefyResponse,
  };
};

/**
 * Get Google Maps link for an address
 * Uses backend geocoding API (with Google Maps API if configured)
 */
export async function getGoogleMapsLink(
  city: string,
  address?: string
): Promise<GeocodeResponse> {
  try {
    const response = await fetch(`${API_CONFIG.baseUrl}/api/geocode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        city,
        address: address || '',
      }),
    });

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }

    const data: GeocodeResponse = await response.json();
    return data;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error getting Google Maps link:', error);
    }

    // Fallback: generate simple link on client side
    const fullAddress = address ? `${address}, ${city}` : city;
    const encodedAddress = encodeURIComponent(fullAddress);

    return {
      googleMapsLink: `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
      address: fullAddress,
      usesFallback: true,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send order data to backend
 * Backend handles routing to n8n webhook and Ordefy
 * This is called after user completes all checkout steps
 */
export async function sendOrderToN8N(
  orderData: OrderData
): Promise<SendOrderResponse> {
  try {
    // Generate Google Maps link (more precise version)
    let googleMapsLink: string | null = null;

    // Only generate Google Maps link from actual GPS coordinates (browser geolocation).
    // Never geocode manual text addresses into coordinates: that creates
    // fake GPS links that confuse downstream systems (n8n bot sends wrong template).
    if (orderData.lat && orderData.long) {
      googleMapsLink = `https://www.google.com/maps?q=${orderData.lat},${orderData.long}`;
    }

    // Send to backend (which handles n8n and Ordefy)
    const response = await fetch(`${API_CONFIG.baseUrl}/api/send-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...orderData,
        googleMapsLink,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const raw: unknown = await response.json();

    return readSendOrderResponse(raw, orderData.orderNumber);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to send order';
    if (import.meta.env.DEV) {
      console.error('Error sending order:', errorMessage);
    }

    return {
      success: false,
      message: errorMessage,
      orderNumber: orderData.orderNumber,
      error: errorMessage,
    };
  }
}

/**
 * Background version of sendOrderToN8N. Never rejects: a failed send resolves
 * with success:false and no purchaseEventId, which is the legacy pixel path.
 * Only the Purchase pixel waits on this promise, the UI never does.
 */
export function sendOrderInBackground(orderData: OrderData): Promise<SendOrderResponse> {
  // setTimeout runs the send after the current call stack clears so the
  // success transition stays instant.
  return new Promise((resolve) => {
    setTimeout(() => {
      void sendOrderToN8N(orderData).then(resolve);
    }, 0);
  });
}

/**
 * Generate a unique order number
 * Format: #NOC-MMDD-XXXX (e.g., #NOC-0121-5847)
 */
export interface CheckoutStartedData {
  name: string;
  phone: string;
  location: string;
  address: string;
  lat?: number;
  long?: number;
  bundleLabel: string;
  quantity: number;
  price: number;
  colors?: string[];
}

/**
 * Fire-and-forget notification when user completes Step 1 (contact info)
 * Used for abandoned checkout recovery via n8n
 */
export function notifyCheckoutStarted(data: CheckoutStartedData): void {
  setTimeout(() => {
    fetch(`${API_CONFIG.baseUrl}/api/checkout-started`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch(() => {});
  }, 0);
}

export function generateOrderNumber(): string {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');

  return `#NOC-${month}${day}-${random}`;
}
