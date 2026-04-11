/**
 * Meta Advanced Matching helpers.
 *
 * Captures fbclid from the landing URL and persists it as the _fbc cookie
 * using Meta's documented format (fb.1.<unix_ts>.<fbclid>). Reads the
 * _fbp/_fbc cookies set by fbevents.js. Provides SHA-256 hashing helpers
 * for email, phone (E.164) and external_id, so the pixel can fire with
 * user_data populated without ever sending plaintext PII.
 *
 * References:
 *   https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/customer-information-parameters
 *   https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/fbp-and-fbc
 */

const FBC_COOKIE = '_fbc';
const FBP_COOKIE = '_fbp';
const COOKIE_MAX_AGE_DAYS = 90;

const isBrowser = (): boolean => typeof window !== 'undefined' && typeof document !== 'undefined';

const setCookie = (name: string, value: string, maxAgeDays: number): void => {
  if (!isBrowser()) return;
  const maxAge = maxAgeDays * 24 * 60 * 60;
  const host = window.location.hostname;
  const parts = host.split('.');
  const domain = parts.length >= 2 ? `.${parts.slice(-2).join('.')}` : host;
  document.cookie = `${name}=${value}; Max-Age=${maxAge}; Path=/; Domain=${domain}; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
};

const readCookie = (name: string): string | undefined => {
  if (!isBrowser()) return undefined;
  const target = `${name}=`;
  const parts = document.cookie.split(';');
  for (const part of parts) {
    const trimmed = part.trimStart();
    if (trimmed.startsWith(target)) {
      return trimmed.slice(target.length);
    }
  }
  return undefined;
};

/**
 * Reads ?fbclid= from the current URL and persists _fbc cookie if not already set.
 * Safe to call on every page load. Idempotent.
 */
export const captureFbclid = (): void => {
  if (!isBrowser()) return;
  try {
    const params = new URLSearchParams(window.location.search);
    const fbclid = params.get('fbclid');
    if (!fbclid) return;
    if (readCookie(FBC_COOKIE)) return;
    const fbcValue = `fb.1.${Date.now()}.${fbclid}`;
    setCookie(FBC_COOKIE, fbcValue, COOKIE_MAX_AGE_DAYS);
  } catch {
    // ignore, non critical
  }
};

export const getFbc = (): string | undefined => readCookie(FBC_COOKIE);

export const getFbp = (): string | undefined => readCookie(FBP_COOKIE);

/**
 * SHA-256 hex via SubtleCrypto. Returns undefined if the API is unavailable
 * (ancient browsers, non secure contexts) so callers can skip user_data gracefully.
 */
export const sha256Hex = async (value: string): Promise<string | undefined> => {
  if (!isBrowser()) return undefined;
  const subtle = window.crypto?.subtle;
  if (!subtle) return undefined;
  try {
    const bytes = new TextEncoder().encode(value);
    const hashBuffer = await subtle.digest('SHA-256', bytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return undefined;
  }
};

export const hashEmail = async (email: string | undefined): Promise<string | undefined> => {
  if (!email) return undefined;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return undefined;
  return sha256Hex(normalized);
};

/**
 * Normalizes a phone number to digits only (including country code, no +)
 * and returns SHA-256 hex. Meta expects E.164 format without the leading +.
 */
export const hashPhoneE164 = async (phone: string | undefined): Promise<string | undefined> => {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, '');
  if (!digits) return undefined;
  return sha256Hex(digits);
};

export const hashExternalId = async (value: string | undefined): Promise<string | undefined> => {
  if (!value) return undefined;
  const normalized = value.trim();
  if (!normalized) return undefined;
  return sha256Hex(normalized);
};
