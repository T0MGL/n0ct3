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

    // If we have lat/long from geolocation, use those (most accurate)
    if (orderData.lat && orderData.long) {
      googleMapsLink = `https://www.google.com/maps?q=${orderData.lat},${orderData.long}`;
      console.log('📍 Google Maps link from coordinates:', googleMapsLink);
    } else if (orderData.address && orderData.location) {
      // If we have both address and location, use geocoding for precision
      try {
        const geocodeResult = await getGoogleMapsLink(
          orderData.location,
          orderData.address
        );
        
        // ONLY use the link if it's NOT a fallback (precise location found)
        if (!geocodeResult.usesFallback) {
          googleMapsLink = geocodeResult.googleMapsLink;
          console.log('📍 Google Maps link from geocoding:', googleMapsLink);
        } else {
          console.log('⚠️ Geocoding returned fallback link, ignoring for Ordefy to avoid fake location links.');
        }
      } catch (error) {
        console.warn('⚠️ Could not generate Google Maps link:', error);
        // Continue without link
      }
    } else if (orderData.location) {
      // Fallback: just use location/city - DO NOT generate a map link here
      // This ensures we send text address to Ordefy instead of a search link
      console.log('ℹ️ Location only provided, skipping Google Maps search link generation.');
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
 * Generate a unique order number
 */
export function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');

  return `#NOCTE-${year}${month}${day}-${random}`;
}
