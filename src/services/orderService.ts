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
  n8nResponse?: unknown;
  ordefyResponse?: unknown;
  error?: string;
}

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
    console.error('Error getting Google Maps link:', error);

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
    console.log('📦 Sending order to backend...', orderData);

    // Generate Google Maps link (more precise version)
    let googleMapsLink: string | null = null;

    // Only generate Google Maps link from actual GPS coordinates (browser geolocation).
    // Never geocode manual text addresses into coordinates — that creates
    // fake GPS links that confuse downstream systems (n8n bot sends wrong template).
    if (orderData.lat && orderData.long) {
      googleMapsLink = `https://www.google.com/maps?q=${orderData.lat},${orderData.long}`;
      console.log('📍 Google Maps link from GPS coordinates:', googleMapsLink);
    } else {
      console.log('ℹ️ No GPS coordinates, sending text address only (no googleMapsLink).');
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

    const result: SendOrderResponse = await response.json();
    console.log('✅ Order sent successfully:', result);

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to send order';
    console.error('❌ Error sending order:', errorMessage);

    return {
      success: false,
      message: errorMessage,
      orderNumber: orderData.orderNumber,
      error: errorMessage,
    };
  }
}

/**
 * Fire-and-forget version of sendOrderToN8N
 * Sends order in background without blocking UI
 * Errors are logged but don't affect user flow
 */
export function sendOrderInBackground(orderData: OrderData): void {
  // Use setTimeout to ensure this runs after the current call stack clears
  // This makes the UI transition instant
  setTimeout(() => {
    sendOrderToN8N(orderData).catch((error) => {
      console.error('❌ Background order send failed:', error);
    });
  }, 0);
}

/**
 * Generate a unique order number
 * Format: #NOC-MMDD-XXXX (e.g., #NOC-0121-5847)
 */
export function generateOrderNumber(): string {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');

  return `#NOC-${month}${day}-${random}`;
}
