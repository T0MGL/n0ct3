/**
 * Origen del pedido para Ordefy (contrato: EXTERNAL_API_DOCUMENTATION.md,
 * seccion 1.1 Attribution).
 *
 * Se captura una vez al arrancar, antes de que el router toque la URL, y vive
 * en localStorage de primera parte: sin cookies, sin IP, sin user agent, sin
 * nada de terceros. El pedido lleva solo el ultimo toque vivo.
 *
 * Una visita sin UTM ni click id (recarga, navegacion interna, vuelta directa)
 * nunca pisa un toque: el que llego por un anuncio sigue siendo el que vendio.
 */

const STORAGE_KEY = 'nocte_attribution_v1';
const TOUCH_TTL_MS = 30 * 24 * 60 * 60 * 1000;
// Ordefy tira el objeto entero si pasa de 8 KB. Un toque real ronda los 500
// bytes: uno de 4 KB es basura y no vale la pena guardarlo.
const MAX_TOUCH_CHARS = 4096;
const MAX_UTM_LENGTH = 255;
const MAX_URL_LENGTH = 1024;
// Tolerancia para un reloj del dispositivo que va apenas adelantado. Ordefy
// rechaza lo que venga mas de 5 minutos en el futuro.
const FUTURE_SKEW_MS = 5 * 60 * 1000;

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id'] as const;
const CLICK_ID_KEYS = ['fbclid', 'gclid', 'wbraid', 'gbraid', 'ttclid'] as const;

type UtmKey = (typeof UTM_KEYS)[number];
type ClickIdKey = (typeof CLICK_ID_KEYS)[number];

const SOURCE_BY_CLICK_ID: Record<ClickIdKey, string> = {
  fbclid: 'meta',
  gclid: 'google',
  wbraid: 'google',
  gbraid: 'google',
  ttclid: 'tiktok',
};

const SOURCE_SLUG = /^[a-z0-9][a-z0-9._-]{0,63}$/;
const CLICK_ID_VALUE = /^[\x21-\x7E]{1,500}$/;
// Control C0/C1, soft hyphen, zero width, marcas de direccion y BOM. Llegan
// pegados en URLs copiadas de apps y no se ven en el panel de Ordefy.
// eslint-disable-next-line no-control-regex
const INVISIBLE_CHARS = /[\u0000-\u001F\u007F-\u009F\u00AD\u061C\u180E\u200B-\u200F\u2028-\u202E\u2060-\u206F\uFEFF]/g;
const ALLOWED_URL_PROTOCOLS = new Set(['http:', 'https:', 'android-app:']);

type Touch = Partial<Record<UtmKey, string>> & {
  source?: string;
  click_ids?: Partial<Record<ClickIdKey, string>>;
  landing_page?: string;
  referrer?: string;
  captured_at: string;
};

type StoredAttribution = { first?: Touch; last?: Touch };

export type OrderAttribution = Touch & { touch: 'last' };

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export type AttributionEnv = {
  href: string;
  referrer: string;
  storage: StorageLike;
  now: number;
};

const browserEnv = (): AttributionEnv | undefined => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return undefined;
  return {
    href: window.location.href,
    referrer: document.referrer,
    storage: window.localStorage,
    now: Date.now(),
  };
};

const cleanText = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const cleaned = value.replace(INVISIBLE_CHARS, '').trim();
  return cleaned.length > 0 ? cleaned : undefined;
};

// Un valor que no entra se descarta, no se corta: una campana truncada es una
// campana que no existe en el administrador de anuncios.
const cleanUtm = (value: unknown): string | undefined => {
  const cleaned = cleanText(value);
  return cleaned && cleaned.length <= MAX_UTM_LENGTH ? cleaned : undefined;
};

const cleanClickId = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return CLICK_ID_VALUE.test(trimmed) ? trimmed : undefined;
};

// Solo origen y path. La query y el hash pueden traer datos personales
// (telefonos en links de WhatsApp, tokens de sesion de otros sitios).
const originAndPath = (value: unknown): string | undefined => {
  const cleaned = cleanText(value);
  if (!cleaned) return undefined;
  let url: URL;
  try {
    url = new URL(cleaned);
  } catch {
    return undefined;
  }
  if (!ALLOWED_URL_PROTOCOLS.has(url.protocol) || !url.host) return undefined;
  // android-app:// no es un esquema especial y su origin da "null": el
  // referrer real de Instagram y Facebook se arma a mano.
  const origin = url.protocol === 'android-app:' ? `${url.protocol}//${url.host}` : url.origin;
  const result = `${origin}${url.pathname}`;
  return result.length <= MAX_URL_LENGTH ? result : undefined;
};

const siteHost = (value: string): string | undefined => {
  try {
    return new URL(value).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
};

const deriveSource = (utmSource: string | undefined, clickIds: Touch['click_ids']): string | undefined => {
  const slug = utmSource?.toLowerCase();
  if (slug && SOURCE_SLUG.test(slug)) return slug;
  const clickId = CLICK_ID_KEYS.find((key) => clickIds?.[key]);
  return clickId ? SOURCE_BY_CLICK_ID[clickId] : undefined;
};

/**
 * Arma un toque con lo que venga, validando cada campo. Sirve tanto para la
 * URL de la visita como para releer lo guardado: localStorage lo puede editar
 * cualquiera, asi que se lee con la misma desconfianza que un query string.
 */
const buildTouch = (raw: Record<string, unknown>, capturedAt: string): Touch | undefined => {
  const utms = UTM_KEYS.flatMap((key) => {
    const value = cleanUtm(raw[key]);
    return value ? [[key, value] as const] : [];
  });

  const rawClickIds = raw.click_ids && typeof raw.click_ids === 'object' ? (raw.click_ids as Record<string, unknown>) : {};
  const clickIds = Object.fromEntries(
    CLICK_ID_KEYS.flatMap((key) => {
      const value = cleanClickId(rawClickIds[key]);
      return value ? [[key, value] as const] : [];
    }),
  ) as Partial<Record<ClickIdKey, string>>;
  const hasClickIds = Object.keys(clickIds).length > 0;

  const referrer = originAndPath(raw.referrer);
  if (utms.length === 0 && !hasClickIds && !referrer) return undefined;

  const source = deriveSource(utms.find(([key]) => key === 'utm_source')?.[1], clickIds);
  const landingPage = originAndPath(raw.landing_page);
  const touch: Touch = {
    ...(source ? { source } : {}),
    ...Object.fromEntries(utms),
    ...(hasClickIds ? { click_ids: clickIds } : {}),
    ...(landingPage ? { landing_page: landingPage } : {}),
    ...(referrer ? { referrer } : {}),
    captured_at: capturedAt,
  };
  return JSON.stringify(touch).length <= MAX_TOUCH_CHARS ? touch : undefined;
};

const isCampaignTouch = (touch: Touch): boolean =>
  UTM_KEYS.some((key) => touch[key] !== undefined) || touch.click_ids !== undefined;

const liveTouch = (raw: unknown, now: number): Touch | undefined => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const record = raw as Record<string, unknown>;
  if (typeof record.captured_at !== 'string') return undefined;
  const capturedMs = Date.parse(record.captured_at);
  if (Number.isNaN(capturedMs)) return undefined;
  if (capturedMs > now + FUTURE_SKEW_MS) return undefined;
  if (now - capturedMs >= TOUCH_TTL_MS) return undefined;
  return buildTouch(record, new Date(capturedMs).toISOString());
};

const readStored = (storage: StorageLike, now: number): StoredAttribution => {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!parsed || typeof parsed !== 'object') return {};
  const { first, last } = parsed as Record<string, unknown>;
  return { first: liveTouch(first, now), last: liveTouch(last, now) };
};

const writeStored = (storage: StorageLike, stored: StoredAttribution): void => {
  if (!stored.first && !stored.last) {
    storage.removeItem(STORAGE_KEY);
    return;
  }
  storage.setItem(STORAGE_KEY, JSON.stringify(stored));
};

const touchFromVisit = (env: AttributionEnv): Touch | undefined => {
  const url = new URL(env.href);
  const params = url.searchParams;
  const raw: Record<string, unknown> = { landing_page: env.href };

  for (const key of UTM_KEYS) raw[key] = params.get(key) ?? undefined;
  raw.click_ids = Object.fromEntries(CLICK_ID_KEYS.map((key) => [key, params.get(key) ?? undefined]));

  const referrerHost = env.referrer ? siteHost(env.referrer) : undefined;
  if (referrerHost && referrerHost !== siteHost(env.href)) raw.referrer = env.referrer;

  return buildTouch(raw, new Date(env.now).toISOString());
};

/**
 * Corre una vez al arrancar la app. Nunca tira ni bloquea el render: en modo
 * privado, con storage lleno o con una URL rara, simplemente no guarda nada.
 */
export const captureAttribution = (override?: AttributionEnv): void => {
  try {
    const env = override ?? browserEnv();
    if (!env) return;
    const stored = readStored(env.storage, env.now);
    const visit = touchFromVisit(env);

    if (visit && isCampaignTouch(visit)) {
      // El primer toque es el mas viejo que siga vivo: si el first original
      // vencio pero el last no, ese last paso a ser el primero de la ventana.
      writeStored(env.storage, { first: stored.first ?? stored.last ?? visit, last: visit });
      return;
    }

    // Una visita que solo trae referrer externo (bio de Instagram, Google
    // organico) cuenta unicamente si no hay ningun toque vivo. Nunca le gana a
    // un anuncio.
    if (visit && !stored.first && !stored.last) {
      writeStored(env.storage, { first: visit, last: visit });
      return;
    }

    // Reescribe para podar lo vencido o lo que no paso la validacion.
    writeStored(env.storage, stored);
  } catch {
    // Sin atribucion la tienda sigue vendiendo igual.
  }
};

/**
 * El bloque `attribution` del pedido: el ultimo toque vivo, o undefined si no
 * hay ninguno, para que el body quede exactamente como antes (sin la key).
 */
export const readOrderAttribution = (override?: AttributionEnv): OrderAttribution | undefined => {
  try {
    const env = override ?? browserEnv();
    if (!env) return undefined;
    const { last } = readStored(env.storage, env.now);
    return last ? { ...last, touch: 'last' } : undefined;
  } catch {
    return undefined;
  }
};
