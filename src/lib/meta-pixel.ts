/**
 * Meta (Facebook) Pixel Integration
 *
 * This module provides type-safe utilities for tracking conversion events
 * with Meta/Facebook Pixel for ROAS measurement and ad optimization.
 */

declare global {
  interface Window {
    fbq: {
      (action: 'track' | 'trackCustom', eventName: string, parameters?: Record<string, unknown>, options?: { eventID?: string }): void;
      (action: 'init', pixelId: string, userData?: Record<string, unknown>): void;
    };
    _fbq: unknown;
  }
}

/**
 * User data for Meta Advanced Matching on a single event.
 * All values are expected to be SHA-256 hex hashes except fbc and fbp
 * which are cookie values and must NOT be hashed.
 */
export interface MetaUserData {
  em?: string;
  ph?: string;
  external_id?: string;
  fbc?: string;
  fbp?: string;
}

/**
 * Initialize Meta Pixel
 * Call this once when the app loads
 */
export const initMetaPixel = (pixelId: string): void => {
  if (typeof window === 'undefined') return;

  // Check if pixel is already initialized
  if (window.fbq) {
    console.log('📊 Meta Pixel already initialized');
    return;
  }

  // Initialize the fbq function. Dead code in production: the inline snippet
  // in index.html wins, this path never runs. Kept for parity with Meta's
  // official bootstrap but cast through unknown to satisfy the stricter
  // window.fbq overload signature.
  const bootstrap = function (...args: unknown[]) {
    interface FbqExtended {
      callMethod?: (...methodArgs: unknown[]) => void;
      queue: unknown[];
      push: (...pushArgs: unknown[]) => void;
      loaded: boolean;
      version: string;
    }
    const fbq = window.fbq as unknown as FbqExtended;
    if (fbq.callMethod) {
      fbq.callMethod.apply(window.fbq, args);
    } else {
      fbq.queue.push(args);
    }
  };
  window.fbq = bootstrap as unknown as Window['fbq'];

  if (!window._fbq) window._fbq = window.fbq;
  interface FbqExtended {
    push: (...args: unknown[]) => void;
    loaded: boolean;
    version: string;
    queue: unknown[];
  }
  const fbq = window.fbq as unknown as FbqExtended;
  fbq.push = window.fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.queue = [];

  // Load the pixel script
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);

  // Initialize the pixel with your ID
  window.fbq('init', pixelId);

  console.log('📊 Meta Pixel initialized:', pixelId);
};

/**
 * Track PageView event
 * Call this on route changes or initial page load
 */
export const trackPageView = (): void => {
  if (typeof window === 'undefined' || !window.fbq) return;

  window.fbq('track', 'PageView');
  console.log('📊 Meta Pixel: PageView tracked');
};

/**
 * Track ViewContent event
 * Call when user views the product
 */
export const trackViewContent = (params?: {
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  content_type?: string;
  value?: number;
  currency?: string;
}): void => {
  if (typeof window === 'undefined' || !window.fbq) return;

  const defaultParams = {
    content_name: 'NOCTE® Red Light Blocking Glasses',
    content_category: 'Sleep & Wellness',
    content_ids: ['nocte-red-glasses'],
    content_type: 'product',
    value: 229000,
    currency: 'PYG',
  };

  window.fbq('track', 'ViewContent', { ...defaultParams, ...params });
  console.log('📊 Meta Pixel: ViewContent tracked', { ...defaultParams, ...params });
};

/**
 * Track InitiateCheckout event
 * Call when user clicks "Buy Now" button
 */
export const trackInitiateCheckout = (params?: {
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  num_items?: number;
  value?: number;
  currency?: string;
}): void => {
  if (typeof window === 'undefined' || !window.fbq) return;

  const defaultParams = {
    content_name: 'NOCTE® Red Light Blocking Glasses',
    content_category: 'Sleep & Wellness',
    content_ids: ['nocte-red-glasses'],
    num_items: 1,
    value: 229000,
    currency: 'PYG',
  };

  window.fbq('track', 'InitiateCheckout', { ...defaultParams, ...params });
  console.log('📊 Meta Pixel: InitiateCheckout tracked', { ...defaultParams, ...params });
};

/**
 * Track AddToCart event
 * Call when user selects quantity/upsell
 */
export const trackAddToCart = (params: {
  content_name: string;
  content_ids: string[];
  num_items: number;
  value: number;
  currency: string;
}): void => {
  if (typeof window === 'undefined' || !window.fbq) return;

  window.fbq('track', 'AddToCart', {
    content_name: params.content_name,
    content_category: 'Sleep & Wellness',
    content_ids: params.content_ids,
    content_type: 'product',
    num_items: params.num_items,
    value: params.value,
    currency: params.currency,
  });

  console.log('📊 Meta Pixel: AddToCart tracked', params);
};

/**
 * Track AddPaymentInfo event
 * Call when user enters payment information
 */
export const trackAddPaymentInfo = (params: {
  content_category?: string;
  content_ids?: string[];
  num_items?: number;
  value: number;
  currency: string;
  payment_type?: string; // e.g., 'Pago contra entrega', 'Tarjeta'
}): void => {
  if (typeof window === 'undefined' || !window.fbq) return;

  const defaultParams = {
    content_category: 'Sleep & Wellness',
    content_ids: ['nocte-red-glasses'],
    ...params,
  };

  window.fbq('track', 'AddPaymentInfo', defaultParams);
  console.log('📊 Meta Pixel: AddPaymentInfo tracked', defaultParams);
};

const PIXEL_ID = '1461479988681927';

/**
 * Track Purchase event (conversion)
 * Call when order is successfully completed
 * This is the most important event for ROAS measurement
 *
 * When userData is provided, the pixel is re-initialized with the hashed
 * matching values (em, ph, external_id) so Meta attributes the event with
 * Advanced Matching signals. fbc and fbp travel on the event payload as
 * user data, not via init. An optional eventId enables server dedup if a
 * CAPI path is added later.
 */
export const trackPurchase = (
  params: {
    value: number;
    currency: string;
    content_name: string;
    content_ids: string[];
    num_items: number;
    order_id?: string;
  },
  userData?: MetaUserData,
  eventId?: string
): void => {
  if (typeof window === 'undefined' || !window.fbq) return;

  const matching: Record<string, string> = {};
  if (userData?.em) matching.em = userData.em;
  if (userData?.ph) matching.ph = userData.ph;
  if (userData?.external_id) matching.external_id = userData.external_id;

  if (Object.keys(matching).length > 0) {
    try {
      window.fbq('init', PIXEL_ID, matching);
    } catch {
      // non critical, fall through to track
    }
  }

  const payload: Record<string, unknown> = {
    value: params.value,
    currency: params.currency,
    content_name: params.content_name,
    content_category: 'Sleep & Wellness',
    content_type: 'product',
    content_ids: params.content_ids,
    num_items: params.num_items,
  };

  if (params.order_id) payload.order_id = params.order_id;
  if (userData?.fbc) payload.fbc = userData.fbc;
  if (userData?.fbp) payload.fbp = userData.fbp;

  if (eventId) {
    window.fbq('track', 'Purchase', payload, { eventID: eventId });
  } else {
    window.fbq('track', 'Purchase', payload);
  }

  const matchedKeys = Object.keys(matching);
  const safePayloadKeys = Object.keys(payload);
  console.log('Meta Pixel: Purchase tracked', {
    payloadKeys: safePayloadKeys,
    matchedKeys,
    eventId: eventId ?? null,
  });
};

/**
 * Track custom event
 * For any custom tracking needs
 */
export const trackCustomEvent = (eventName: string, parameters?: Record<string, unknown>): void => {
  if (typeof window === 'undefined' || !window.fbq) return;

  window.fbq('trackCustom', eventName, parameters);
  console.log(`📊 Meta Pixel: Custom event "${eventName}" tracked`, parameters);
};
