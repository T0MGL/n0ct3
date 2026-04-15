/**
 * Meta (Facebook) Pixel Integration
 *
 * Type-safe utilities for tracking conversion events with Meta/Facebook Pixel.
 * Every funnel event (ViewContent, AddToCart, InitiateCheckout, AddPaymentInfo,
 * Purchase) supports the same Advanced Matching payload so EMQ stays high
 * across the whole funnel.
 *
 * Advanced Matching: user_data with hashed PII (em, ph, external_id) plus
 * fbc/fbp cookie values flows via the track payload, never via a pixel re-init
 * (re-init on a second call corrupts the pixel, kills downstream events).
 * Helpers in meta-matching.ts produce all values in the format Meta expects.
 * Plaintext PII is never sent.
 *
 * Server-side mirroring (CAPI): every tracker also fires sendCapiEvent with
 * the same event_id. Meta dedupes on (pixel_id, event_name, event_id) within
 * 48h, so both signals count as one conversion while CAPI provides
 * server-side reliability (ad blockers, iOS14.5+, cookie loss).
 */

import {
  sendCapiEvent,
  newEventId,
  nowUnixSeconds,
  type CapiCustomData,
  type CapiEventPayload,
} from './meta-capi';

declare global {
  interface Window {
    fbq: (
      action: 'track' | 'trackCustom' | 'init',
      eventName: string,
      parameters?: Record<string, unknown>,
      options?: Record<string, unknown>
    ) => void;
    _fbq: unknown;
  }
}

/**
 * User data for Meta Advanced Matching on a single event.
 * All PII fields MUST be SHA-256 hex hashed before being passed here.
 * fbc/fbp are raw cookie values (Meta hashes them server-side).
 */
export interface MetaUserData {
  em?: string;
  ph?: string;
  fn?: string;
  ln?: string;
  external_id?: string;
  fbc?: string;
  fbp?: string;
}

const buildUserDataPayload = (user_data?: MetaUserData): Record<string, string> | undefined => {
  if (!user_data) return undefined;
  const entries = Object.entries(user_data).filter(
    ([, value]) => typeof value === 'string' && value.length > 0
  ) as Array<[string, string]>;
  if (entries.length === 0) return undefined;
  return Object.fromEntries(entries);
};

/**
 * Initialize Meta Pixel
 * Call this once when the app loads.
 * In production the inline snippet in index.html wins, this path is only used
 * in dev/preview environments where the inline snippet may be absent.
 */
export const initMetaPixel = (pixelId: string): void => {
  if (typeof window === 'undefined') return;

  if (window.fbq) {
    console.log('Meta Pixel already initialized');
    return;
  }

  window.fbq = function (...args: [string, string, Record<string, unknown>?, Record<string, unknown>?]) {
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

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);

  window.fbq('init', pixelId);

  console.log('Meta Pixel initialized:', pixelId);
};

const NOCTE_CONTENT_NAME = 'NOCTE® Red Light Blocking Glasses';
const NOCTE_CONTENT_CATEGORY = 'Sleep & Wellness';
const NOCTE_CONTENT_ID = 'nocte-red-glasses';
const NOCTE_CONTENT_TYPE = 'product';
const NOCTE_UNIT_PRICE = 229000;
const NOCTE_CURRENCY = 'PYG';

/**
 * Fire CAPI mirror alongside the client pixel. Shares the same event_id so
 * Meta deduplicates in its 48h window. Fire-and-forget, never throws.
 */
const mirrorToCapi = (
  event_name: CapiEventPayload['event_name'],
  event_id: string,
  user_data: MetaUserData | undefined,
  custom_data: CapiCustomData | undefined
): void => {
  if (typeof window === 'undefined') return;
  sendCapiEvent({
    event_name,
    event_id,
    event_time: nowUnixSeconds(),
    event_source_url: window.location.href,
    user_data,
    custom_data,
  });
};

/**
 * Track PageView event
 * Call this on route changes or initial page load
 */
export const trackPageView = (user_data?: MetaUserData, event_id?: string): void => {
  if (typeof window === 'undefined' || !window.fbq) return;

  const eventId = event_id ?? newEventId();
  const userData = buildUserDataPayload(user_data);
  const payload: Record<string, unknown> = {};
  if (userData) payload.user_data = userData;

  window.fbq('track', 'PageView', payload, { eventID: eventId });
  mirrorToCapi('PageView', eventId, user_data, undefined);
  console.log('Meta Pixel: PageView tracked', { hasUserData: Boolean(userData), eventID: eventId });
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
  user_data?: MetaUserData;
  event_id?: string;
}): void => {
  if (typeof window === 'undefined' || !window.fbq) return;

  const eventId = params?.event_id ?? newEventId();
  const userData = buildUserDataPayload(params?.user_data);
  const customData: CapiCustomData = {
    content_name: params?.content_name ?? NOCTE_CONTENT_NAME,
    content_category: params?.content_category ?? NOCTE_CONTENT_CATEGORY,
    content_ids: params?.content_ids ?? [NOCTE_CONTENT_ID],
    content_type: params?.content_type ?? NOCTE_CONTENT_TYPE,
    value: params?.value ?? NOCTE_UNIT_PRICE,
    currency: params?.currency ?? NOCTE_CURRENCY,
  };
  const payload: Record<string, unknown> = { ...customData };
  if (userData) payload.user_data = userData;

  window.fbq('track', 'ViewContent', payload, { eventID: eventId });
  mirrorToCapi('ViewContent', eventId, params?.user_data, customData);
  console.log('Meta Pixel: ViewContent tracked', { ...payload, eventID: eventId });
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
  user_data?: MetaUserData;
  event_id?: string;
}): void => {
  if (typeof window === 'undefined' || !window.fbq) return;

  const eventId = params?.event_id ?? newEventId();
  const userData = buildUserDataPayload(params?.user_data);
  const customData: CapiCustomData = {
    content_name: params?.content_name ?? NOCTE_CONTENT_NAME,
    content_category: params?.content_category ?? NOCTE_CONTENT_CATEGORY,
    content_ids: params?.content_ids ?? [NOCTE_CONTENT_ID],
    content_type: NOCTE_CONTENT_TYPE,
    num_items: params?.num_items ?? 1,
    value: params?.value ?? NOCTE_UNIT_PRICE,
    currency: params?.currency ?? NOCTE_CURRENCY,
  };
  const payload: Record<string, unknown> = { ...customData };
  if (userData) payload.user_data = userData;

  window.fbq('track', 'InitiateCheckout', payload, { eventID: eventId });
  mirrorToCapi('InitiateCheckout', eventId, params?.user_data, customData);
  console.log('Meta Pixel: InitiateCheckout tracked', { ...payload, eventID: eventId });
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
  user_data?: MetaUserData;
  event_id?: string;
}): void => {
  if (typeof window === 'undefined' || !window.fbq) return;

  const eventId = params.event_id ?? newEventId();
  const userData = buildUserDataPayload(params.user_data);
  const customData: CapiCustomData = {
    content_name: params.content_name,
    content_category: NOCTE_CONTENT_CATEGORY,
    content_ids: params.content_ids,
    content_type: NOCTE_CONTENT_TYPE,
    num_items: params.num_items,
    value: params.value,
    currency: params.currency,
  };
  const payload: Record<string, unknown> = { ...customData };
  if (userData) payload.user_data = userData;

  window.fbq('track', 'AddToCart', payload, { eventID: eventId });
  mirrorToCapi('AddToCart', eventId, params.user_data, customData);
  console.log('Meta Pixel: AddToCart tracked', { ...payload, eventID: eventId });
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
  payment_type?: string;
  user_data?: MetaUserData;
  event_id?: string;
}): void => {
  if (typeof window === 'undefined' || !window.fbq) return;

  const eventId = params.event_id ?? newEventId();
  const userData = buildUserDataPayload(params.user_data);
  const customData: CapiCustomData = {
    content_category: params.content_category ?? NOCTE_CONTENT_CATEGORY,
    content_ids: params.content_ids ?? [NOCTE_CONTENT_ID],
    num_items: params.num_items ?? 1,
    value: params.value,
    currency: params.currency,
    ...(params.payment_type && { payment_type: params.payment_type }),
  };
  const payload: Record<string, unknown> = { ...customData };
  if (userData) payload.user_data = userData;

  window.fbq('track', 'AddPaymentInfo', payload, { eventID: eventId });
  mirrorToCapi('AddPaymentInfo', eventId, params.user_data, customData);
  console.log('Meta Pixel: AddPaymentInfo tracked', { ...payload, eventID: eventId });
};

/**
 * Track Purchase event (conversion)
 * Call when order is successfully completed.
 * Most important event for ROAS measurement.
 *
 * Advanced Matching travels on the payload as user_data (NEVER re-init the
 * pixel, it corrupts state and kills downstream events). eventId enables
 * CAPI deduplication when server-side events are added later.
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

  const finalEventId = eventId ?? newEventId();
  const user_data = buildUserDataPayload(userData);
  const customData: CapiCustomData = {
    value: params.value,
    currency: params.currency,
    content_name: params.content_name,
    content_category: NOCTE_CONTENT_CATEGORY,
    content_type: NOCTE_CONTENT_TYPE,
    content_ids: params.content_ids,
    num_items: params.num_items,
    ...(params.order_id && { order_id: params.order_id }),
  };
  const payload: Record<string, unknown> = { ...customData };
  if (user_data) payload.user_data = user_data;

  window.fbq('track', 'Purchase', payload, { eventID: finalEventId });
  mirrorToCapi('Purchase', finalEventId, userData, customData);

  console.log('Meta Pixel: Purchase tracked (CONVERSION)', {
    payloadKeys: Object.keys(payload),
    matchedKeys: user_data ? Object.keys(user_data) : [],
    eventID: finalEventId,
  });
};

/**
 * Track custom event
 * For any custom tracking needs
 */
export const trackCustomEvent = (eventName: string, parameters?: Record<string, unknown>): void => {
  if (typeof window === 'undefined' || !window.fbq) return;

  window.fbq('trackCustom', eventName, parameters);
  console.log(`Meta Pixel: Custom event "${eventName}" tracked`, parameters);
};
