/**
 * Meta Conversions API forwarder.
 *
 * Receives events from the NOCTE frontend (fire-and-forget) and relays them to
 * Meta Graph API. The client pixel fires the same event with the same event_id
 * so Meta deduplicates on (pixel_id, event_name, event_id) in its 48h window.
 *
 * Config (env):
 *   META_CAPI_PIXEL_ID         required, currently 2985948491737420
 *   META_CAPI_ACCESS_TOKEN     required, System User token with ads_management
 *   META_CAPI_API_VERSION      optional, defaults to v20.0
 *   META_CAPI_TEST_EVENT_CODE  optional, set only for validation in Test Events
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

const forwardToMeta = async (event) => {
  const pixelId = process.env.META_CAPI_PIXEL_ID;
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  const version = process.env.META_CAPI_API_VERSION || 'v20.0';
  const testCode = process.env.META_CAPI_TEST_EVENT_CODE;

  if (!pixelId || !token) {
    return { skipped: true, reason: 'missing_env' };
  }

  const url = `https://graph.facebook.com/${version}/${pixelId}/events?access_token=${encodeURIComponent(token)}`;
  const body = { data: [event] };
  if (isString(testCode)) body.test_event_code = testCode;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

module.exports = { register };
