/**
 * Meta Conversions API forwarder.
 *
 * Receives events from the NOCTE frontend (fire-and-forget) and relays them to
 * Meta Graph API. The client pixel fires the same event with the same event_id
 * so Meta deduplicates on (pixel_id, event_name, event_id) in its 48h window.
 *
 * The Purchase is the exception to the mirror: /api/send-order emits it from
 * here once Ordefy confirmed the order (sendPurchase), and the browser replays
 * it with the event_id the route returns. Same event_id convention as the n8n
 * WhatsApp confirmation flows, so a web order confirmed by Helena is one
 * conversion, not two.
 *
 * Config (env):
 *   META_CAPI_PIXEL_ID         required, currently 2985948491737420
 *   META_CAPI_ACCESS_TOKEN     required, System User token with ads_management
 *   META_CAPI_API_VERSION      optional, defaults to v20.0
 *   META_CAPI_TEST_EVENT_CODE  optional, set only for validation in Test Events.
 *                              Never in production: every real Purchase would
 *                              land in Test Events and stop counting for ads.
 *   META_SERVER_PURCHASE       'on' enables the server Purchase. Anything else
 *                              (including unset) keeps today's behavior.
 *
 * Security contract:
 *   - Access token never leaves the server. Never logged, never echoed.
 *   - Never trusts client_ip or client_user_agent from the body. Reads them
 *     from the request headers / connection.
 *   - Rate limited at the Express layer (100 req/min per IP).
 *   - Always returns 202 to the client so no UX signal leaks the server state.
 */

const ALLOWED_EVENTS = new Set([
  'PageView',
  'ViewContent',
  'AddToCart',
  'InitiateCheckout',
  'AddPaymentInfo',
  'Purchase',
]);

const ALLOWED_USER_DATA_KEYS = new Set(['em', 'ph', 'fn', 'ln', 'external_id', 'fbc', 'fbp']);

const ALLOWED_CUSTOM_DATA_KEYS = new Set([
  'value',
  'currency',
  'content_ids',
  'content_name',
  'content_category',
  'content_type',
  'num_items',
  'order_id',
  'payment_type',
]);

const HEX_64 = /^[a-f0-9]{64}$/;
const MAX_STRING = 512;

const isString = (v) => typeof v === 'string' && v.length > 0 && v.length <= MAX_STRING;
const isFiniteNumber = (v) => typeof v === 'number' && Number.isFinite(v);

const sanitizeUserData = (raw) => {
  if (!raw || typeof raw !== 'object') return undefined;
  const out = {};

  for (const key of ['em', 'ph', 'fn', 'ln', 'external_id']) {
    const value = raw[key];
    if (isString(value) && HEX_64.test(value)) {
      out[key] = value;
    }
  }

  for (const key of ['fbc', 'fbp']) {
    const value = raw[key];
    if (isString(value)) {
      out[key] = value;
    }
  }

  const allowedPresent = Object.keys(out).filter((k) => ALLOWED_USER_DATA_KEYS.has(k));
  return allowedPresent.length > 0 ? out : undefined;
};

const sanitizeCustomData = (raw) => {
  if (!raw || typeof raw !== 'object') return undefined;
  const out = {};

  if (isFiniteNumber(raw.value)) out.value = raw.value;
  if (isString(raw.currency)) out.currency = raw.currency.toUpperCase();
  if (Array.isArray(raw.content_ids)) {
    const ids = raw.content_ids.filter(isString).slice(0, 50);
    if (ids.length > 0) out.content_ids = ids;
  }
  if (isString(raw.content_name)) out.content_name = raw.content_name;
  if (isString(raw.content_category)) out.content_category = raw.content_category;
  if (isString(raw.content_type)) out.content_type = raw.content_type;
  if (isFiniteNumber(raw.num_items)) out.num_items = raw.num_items;
  if (isString(raw.order_id)) out.order_id = raw.order_id;
  if (isString(raw.payment_type)) out.payment_type = raw.payment_type;

  const presentKeys = Object.keys(out).filter((k) => ALLOWED_CUSTOM_DATA_KEYS.has(k));
  return presentKeys.length > 0 ? out : undefined;
};

const validateEvent = (body) => {
  if (!body || typeof body !== 'object') {
    return { error: 'invalid_body' };
  }
  if (!ALLOWED_EVENTS.has(body.event_name)) {
    return { error: 'invalid_event_name' };
  }
  if (!isString(body.event_id) || body.event_id.length > 128) {
    return { error: 'invalid_event_id' };
  }
  if (!isFiniteNumber(body.event_time) || body.event_time <= 0) {
    return { error: 'invalid_event_time' };
  }
  if (!isString(body.event_source_url) || !/^https?:\/\//.test(body.event_source_url)) {
    return { error: 'invalid_event_source_url' };
  }
  return { ok: true };
};

const extractClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return String(forwarded[0]).trim();
  }
  return req.ip || req.socket?.remoteAddress || undefined;
};

const buildMetaEvent = (body, req) => {
  const user_data = sanitizeUserData(body.user_data) ?? {};
  const client_ip_address = extractClientIp(req);
  const client_user_agent = req.headers['user-agent'];

  if (client_ip_address) user_data.client_ip_address = client_ip_address;
  if (isString(client_user_agent)) user_data.client_user_agent = client_user_agent;

  const event = {
    event_name: body.event_name,
    event_id: body.event_id,
    event_time: Math.floor(body.event_time),
    event_source_url: body.event_source_url,
    action_source: 'website',
    user_data,
  };

  const custom_data = sanitizeCustomData(body.custom_data);
  if (custom_data) event.custom_data = custom_data;

  return event;
};

const forwardToMeta = async (event, timeoutMs = 8000) => {
  const pixelId = process.env.META_CAPI_PIXEL_ID;
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  const version = process.env.META_CAPI_API_VERSION || 'v20.0';
  const testCode = process.env.META_CAPI_TEST_EVENT_CODE;

  if (!pixelId || !token) {
    return { skipped: true, reason: 'missing_env' };
  }

  const url = `https://graph.facebook.com/${version}/${pixelId}/events`;
  const body = { data: [event] };
  if (isString(testCode)) body.test_event_code = testCode;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Token in the header, not the query string: a query string ends up in
    // access logs and error traces, the header does not.
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      let metaError;
      try {
        metaError = await res.json();
      } catch {
        metaError = { status: res.status };
      }
      return { skipped: false, ok: false, status: res.status, error: metaError };
    }

    const result = await res.json();
    return { skipped: false, ok: true, result };
  } catch (err) {
    return { skipped: false, ok: false, error: err?.message || 'fetch_failed' };
  } finally {
    clearTimeout(timer);
  }
};

const register = (app) => {
  app.post('/api/meta-capi/event', async (req, res) => {
    const validation = validateEvent(req.body);
    if (validation.error) {
      console.warn('[capi] rejected event', { reason: validation.error });
      return res.status(202).json({ accepted: true });
    }

    const event = buildMetaEvent(req.body, req);
    const outcome = await forwardToMeta(event);

    if (outcome.skipped) {
      console.warn('[capi] skipped forward (env missing)', {
        event_name: event.event_name,
        event_id: event.event_id,
      });
    } else if (!outcome.ok) {
      console.error('[capi] meta rejected event', {
        event_name: event.event_name,
        event_id: event.event_id,
        status: outcome.status,
        error: outcome.error,
      });
    } else {
      console.log('[capi] forwarded', {
        event_name: event.event_name,
        event_id: event.event_id,
        fbtrace_id: outcome.result?.fbtrace_id,
        events_received: outcome.result?.events_received,
      });
    }

    return res.status(202).json({ accepted: true });
  });
};

// ==================== SERVER-SIDE PURCHASE ====================

const { createHash } = require('node:crypto');

const PURCHASE_TIMEOUT_MS = 4000;
const SITE_URL = 'https://nocte.studio/';
const CONTENT_NAME = 'NOCTE® Red Light Blocking Glasses';
const CONTENT_CATEGORY = 'Sleep & Wellness';
const CONTENT_ID = 'nocte-red-glasses';

// Meta's documented cookie formats: fb.<subdomain index>.<unix ms>.<id>.
// The id is a random integer for _fbp and the fbclid for _fbc.
const FBP_RE = /^fb\.\d\.\d+\.\d+$/;
const FBC_RE = /^fb\.\d\.\d+\.[A-Za-z0-9_-]+$/;

const sha256 = (value) => createHash('sha256').update(value, 'utf8').digest('hex');
const hashIfPresent = (value) => (value ? sha256(value) : undefined);

const serverPurchaseEnabled = () => process.env.META_SERVER_PURCHASE === 'on';

/**
 * Same event_id the n8n flows build (Confirm Order QLts98LT5bEuQMZ7 and the
 * [COD]/[Transfer] branches of Yl6ZN0Iu5P9jm2x8):
 *   'nocte-purchase-' + String(orderNumber).replace(/[^A-Za-z0-9]/g, '')
 * Meta dedupes on (pixel, event_name, event_id) inside 48h. One byte of
 * difference here and a web order confirmed over WhatsApp counts twice.
 */
const purchaseEventId = (orderNumber) =>
  'nocte-purchase-' + String(orderNumber).replace(/[^A-Za-z0-9]/g, '');

/** Meta's normalization rules, applied before hashing. */
const normalize = {
  email: (v) => String(v || '').trim().toLowerCase() || undefined,
  // Digits only, with country code. A local 09xx loses the zero and takes 595;
  // a bare 9xx (nine digits) is a Paraguayan mobile typed without the zero.
  // Anything else already carries its country code.
  phone: (v) => {
    const digits = String(v || '').replace(/\D/g, '');
    if (!digits) return undefined;
    if (digits.startsWith('0')) return '595' + digits.replace(/^0+/, '');
    if (digits.length === 9 && digits.startsWith('9')) return '595' + digits;
    return digits;
  },
  // Lowercase, punctuation out, accents KEPT (Meta hashes "ramírez" with the
  // tilde, stripping it yields a hash that never matches), inner spaces kept
  // for compound surnames.
  name: (v) =>
    String(v || '')
      .toLowerCase()
      .replace(/[^\p{L}\s]/gu, '')
      .replace(/\s+/g, ' ')
      .trim() || undefined,
  // City: no spaces, no accents, no punctuation.
  city: (v) =>
    String(v || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z]/g, '') || undefined,
};

const cookieFrom = (req, name) => {
  const header = req.headers.cookie;
  if (typeof header !== 'string') return undefined;
  for (const part of header.split(';')) {
    const trimmed = part.trimStart();
    if (trimmed.startsWith(`${name}=`)) return trimmed.slice(name.length + 1);
  }
  return undefined;
};

/**
 * _fbp/_fbc from the request cookie when the browser sent one, else from the
 * body. The storefront lives on nocte.studio and posts cross-origin without
 * credentials, so in practice the body is the only channel today; the cookie
 * still wins if both arrive. Malformed values are dropped, not forwarded.
 */
const readFbIds = (req, body) => {
  const pick = (name, re) => {
    const cookie = cookieFrom(req, name);
    if (isString(cookie) && re.test(cookie)) return cookie;
    const fromBody = body?.[name.slice(1)];
    return isString(fromBody) && re.test(fromBody) ? fromBody : undefined;
  };
  return { fbp: pick('_fbp', FBP_RE), fbc: pick('_fbc', FBC_RE) };
};

/**
 * Hashed user_data for the buyer. external_id is the phone hash, the same key
 * n8n sends, so Meta stitches the web Purchase and the WhatsApp one to the
 * same person.
 */
const buildPurchaseUserData = ({ name, phone, email, city, fbp, fbc }) => {
  const [first, ...rest] = String(name || '').trim().split(/\s+/);
  const phoneDigits = normalize.phone(phone);
  const user = {
    em: hashIfPresent(normalize.email(email)),
    ph: hashIfPresent(phoneDigits),
    fn: hashIfPresent(normalize.name(first)),
    ln: hashIfPresent(normalize.name(rest.join(' '))),
    ct: hashIfPresent(normalize.city(city)),
    country: sha256('py'),
    external_id: hashIfPresent(phoneDigits),
    fbp,
    fbc,
  };
  return Object.fromEntries(Object.entries(user).filter(([, v]) => v));
};

/**
 * Emits the Purchase for an order Ordefy just created. Never throws and never
 * blocks the order: any failure returns null and the caller answers the client
 * without an event id, which makes the browser fall back to today's pixel.
 *
 * Returns the event_id on success (Meta answered events_received >= 1).
 */
const sendPurchase = async ({ req, orderNumber, value, quantity, name, phone, email, city }) => {
  const eventId = purchaseEventId(orderNumber);
  const referer = req.get('referer');
  const contentId = quantity === 1 ? CONTENT_ID : `${CONTENT_ID}-${quantity}pack`;

  try {
    const user_data = buildPurchaseUserData({
      name,
      phone,
      email,
      city,
      ...readFbIds(req, req.body),
    });
    const client_ip_address = extractClientIp(req);
    const client_user_agent = req.headers['user-agent'];
    if (client_ip_address) user_data.client_ip_address = client_ip_address;
    if (isString(client_user_agent)) user_data.client_user_agent = client_user_agent;

    const event = {
      event_name: 'Purchase',
      event_id: eventId,
      event_time: Math.floor(Date.now() / 1000),
      event_source_url: isString(referer) && /^https?:\/\//.test(referer) ? referer : SITE_URL,
      action_source: 'website',
      user_data,
      custom_data: {
        value,
        currency: 'PYG',
        content_name: quantity === 1 ? CONTENT_NAME : `${CONTENT_NAME} - Pack x${quantity}`,
        content_category: CONTENT_CATEGORY,
        content_type: 'product',
        content_ids: [contentId],
        num_items: quantity,
        order_id: String(orderNumber),
      },
    };

    const outcome = await forwardToMeta(event, PURCHASE_TIMEOUT_MS);
    if (outcome.ok && Number(outcome.result?.events_received) >= 1) return eventId;

    console.error('[capi] purchase not accepted', {
      event_id: eventId,
      skipped: outcome.skipped === true,
      status: outcome.status,
      error: outcome.error,
    });
    return null;
  } catch (err) {
    console.error('[capi] purchase failed', { event_id: eventId, error: err?.message || 'unknown' });
    return null;
  }
};

module.exports = {
  register,
  sendPurchase,
  serverPurchaseEnabled,
  purchaseEventId,
  normalize,
  readFbIds,
  buildPurchaseUserData,
};
