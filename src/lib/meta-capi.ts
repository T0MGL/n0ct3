/**
 * Meta Conversions API (server-side) client.
 *
 * Mirrors every client pixel event to the NOCTE backend, which forwards it to
 * Meta via CAPI with the same event_id for deduplication (48h window).
 *
 * Fire-and-forget. UX must never block on this call. Errors are swallowed
 * intentionally: the client pixel remains the source of truth if the server
 * mirror fails for any reason.
 *
 * Dedup contract with meta-pixel.ts: every tracker passes the SAME event_id to
 * window.fbq options.eventID and to sendCapiEvent. Breaking that contract
 * duplicates events in Events Manager and breaks attribution.
 */

import type { MetaUserData } from './meta-pixel';

const CAPI_ENDPOINT = 'https://api.nocte.studio/api/meta-capi/event';

export interface CapiCustomData {
  value?: number;
  currency?: string;
  content_ids?: string[];
  content_name?: string;
  content_category?: string;
  content_type?: string;
  num_items?: number;
  order_id?: string;
  payment_type?: string;
}

export interface CapiEventPayload {
  event_name:
    | 'PageView'
    | 'ViewContent'
    | 'AddToCart'
    | 'InitiateCheckout'
    | 'AddPaymentInfo'
    | 'Purchase';
  event_id: string;
  event_time: number;
  event_source_url: string;
  user_data?: MetaUserData;
  custom_data?: CapiCustomData;
}

export const newEventId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

export const nowUnixSeconds = (): number => Math.floor(Date.now() / 1000);

export const sendCapiEvent = (payload: CapiEventPayload): void => {
  if (typeof window === 'undefined') return;

  try {
    void fetch(CAPI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
      credentials: 'omit',
      mode: 'cors',
    }).catch(() => undefined);
  } catch {
    // swallow, client pixel still fires
  }
};
