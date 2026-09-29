/**
 * Origen del pedido que viaja a Ordefy (contrato: EXTERNAL_API_DOCUMENTATION.md
 * de Ordefy, seccion 1.1 Attribution).
 *
 * Lo que manda el navegador es input no confiable: se re-valida con las mismas
 * reglas del contrato y solo pasan las keys que Ordefy conoce. Ordefy tambien
 * valida, pero una key rara o un valor gigante no tiene por que salir de aca.
 *
 * Nunca rompe un pedido: cualquier error, o nada valido, es "sin attribution".
 */

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id'];

// Ordefy mide el tope en bytes UTF-8 (Buffer.byteLength), no en caracteres.
const MAX_ATTRIBUTION_BYTES = 8 * 1024;
const MAX_CLICK_IDS = 10;
const MAX_CLICK_IDS_CHARS = 3 * 1024;
const MAX_UTM_LENGTH = 255;
const MAX_URL_LENGTH = 1024;
const FUTURE_SKEW_MS = 5 * 60 * 1000;

const SOURCE_SLUG = /^[a-z0-9][a-z0-9._-]{0,63}$/;
const CLICK_ID_KEY = /^[a-z][a-z0-9_]{1,31}$/;
const CLICK_ID_VALUE = /^[\x21-\x7E]{1,500}$/;
// Cookies de Meta y Google, no click ids. Y nada que huela a credencial.
const FORBIDDEN_CLICK_ID_KEYS = new Set(['fbp', 'fbc', 'ga', 'gid']);
const FORBIDDEN_CLICK_ID_FRAGMENTS = ['token', 'secret', 'session', 'cookie', 'passw', 'auth', 'api_key'];
const ISO_WITH_ZONE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?(Z|[+-]\d{2}:?\d{2})$/;
const INVISIBLE_CHARS = /[\u0000-\u001F\u007F-\u009F\u00AD\u061C\u180E\u200B-\u200F\u2028-\u202E\u2060-\u206F\uFEFF]/g;
const ALLOWED_URL_PROTOCOLS = new Set(['http:', 'https:', 'android-app:']);

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

// Un ID de Meta tiene 18 digitos: como number ya llega redondeado, asi que
// solo se acepta un entero seguro y se pasa a string.
const toIdString = (value) => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isSafeInteger(value)) return String(value);
  return undefined;
};

const cleanUtm = (value) => {
  const raw = toIdString(value);
  if (raw === undefined) return undefined;
  const cleaned = raw.replace(INVISIBLE_CHARS, '').trim();
  return cleaned.length > 0 && cleaned.length <= MAX_UTM_LENGTH ? cleaned : undefined;
};

const cleanSource = (value) => {
  if (typeof value !== 'string') return undefined;
  const slug = value.trim().toLowerCase();
  return SOURCE_SLUG.test(slug) ? slug : undefined;
};

const isForbiddenClickIdKey = (key) =>
  FORBIDDEN_CLICK_ID_KEYS.has(key) || FORBIDDEN_CLICK_ID_FRAGMENTS.some((part) => key.includes(part));

const cleanClickIds = (value) => {
  if (!isPlainObject(value)) return undefined;
  const clickIds = {};
  for (const [rawKey, rawValue] of Object.entries(value)) {
    if (Object.keys(clickIds).length >= MAX_CLICK_IDS) break;
    const key = rawKey.toLowerCase();
    if (!CLICK_ID_KEY.test(key) || isForbiddenClickIdKey(key) || Object.hasOwn(clickIds, key)) continue;
    const id = toIdString(rawValue)?.trim();
    if (id && CLICK_ID_VALUE.test(id)) clickIds[key] = id;
  }
  if (Object.keys(clickIds).length === 0) return undefined;
  return JSON.stringify(clickIds).length <= MAX_CLICK_IDS_CHARS ? clickIds : undefined;
};

// Ordefy guarda solo origen y path: la query puede traer datos personales.
const cleanUrl = (value) => {
  if (typeof value !== 'string') return undefined;
  let url;
  try {
    url = new URL(value.replace(INVISIBLE_CHARS, '').trim());
  } catch {
    return undefined;
  }
  if (!ALLOWED_URL_PROTOCOLS.has(url.protocol) || !url.host) return undefined;
  const origin = url.protocol === 'android-app:' ? `${url.protocol}//${url.host}` : url.origin;
  const result = `${origin}${url.pathname}`;
  return result.length <= MAX_URL_LENGTH ? result : undefined;
};

const cleanCapturedAt = (value, now) => {
  if (typeof value !== 'string' || !ISO_WITH_ZONE.test(value)) return undefined;
  const ms = Date.parse(value);
  if (Number.isNaN(ms) || ms > now + FUTURE_SKEW_MS) return undefined;
  return new Date(ms).toISOString();
};

/**
 * Devuelve el bloque listo para el payload de Ordefy, o undefined si no queda
 * ningun dato de origen valido (captured_at y touch solos no dicen nada).
 */
function sanitizeAttribution(raw, now = Date.now()) {
  try {
    if (!isPlainObject(raw)) return undefined;
    // Corte temprano contra bodies inflados, antes de recorrer nada.
    if (JSON.stringify(raw).length > MAX_ATTRIBUTION_BYTES) return undefined;

    const attribution = {};
    const source = cleanSource(raw.source);
    if (source) attribution.source = source;
    for (const key of UTM_KEYS) {
      const value = cleanUtm(raw[key]);
      if (value) attribution[key] = value;
    }
    const clickIds = cleanClickIds(raw.click_ids);
    if (clickIds) attribution.click_ids = clickIds;
    const landingPage = cleanUrl(raw.landing_page);
    if (landingPage) attribution.landing_page = landingPage;
    const referrer = cleanUrl(raw.referrer);
    if (referrer) attribution.referrer = referrer;

    if (Object.keys(attribution).length === 0) return undefined;

    const capturedAt = cleanCapturedAt(raw.captured_at, now);
    if (capturedAt) attribution.captured_at = capturedAt;
    if (raw.touch === 'first' || raw.touch === 'last') attribution.touch = raw.touch;
    // Un UTM de 255 caracteres no ASCII pesa hasta 765 bytes: lo que entra en
    // caracteres puede pasarse en bytes, y Ordefy lo tiraria entero.
    if (Buffer.byteLength(JSON.stringify(attribution)) > MAX_ATTRIBUTION_BYTES) return undefined;
    return attribution;
  } catch {
    return undefined;
  }
}

/**
 * Resumen de la respuesta de Ordefy para el log: estado y codigos, nunca
 * valores. Ordefy ya no los devuelve, pero el log no depende de eso.
 */
function describeAttributionResult(result) {
  if (!isPlainObject(result) || typeof result.attribution_status !== 'string') return undefined;
  const warnings = Array.isArray(result.attribution_warnings) ? result.attribution_warnings : [];
  const codes = warnings
    .filter((w) => isPlainObject(w) && typeof w.code === 'string')
    .map((w) => (typeof w.field === 'string' ? `${w.field}:${w.code}` : w.code));
  return codes.length > 0 ? `${result.attribution_status} (${codes.join(', ')})` : result.attribution_status;
}

module.exports = { sanitizeAttribution, describeAttributionResult };
