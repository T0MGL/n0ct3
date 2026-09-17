// Vercel's IPv4 ingress cannot observe the IPv6 seen by Meta's browser pixel.
// This optional lookup sends no order data, cookies, or referrer to the resolver.
const IPV6_ENDPOINT = 'https://api6.ipify.org';
const MAX_AGE_MS = 5 * 60 * 1000;
let startedAt: number | undefined;
let clientIpv6: string | undefined;

export const collectClientIpv6 = (): void => {
  if (typeof window === 'undefined' || typeof AbortController === 'undefined') return;
  if (startedAt !== undefined && Date.now() - startedAt < MAX_AGE_MS) return;
  startedAt = Date.now();
  clientIpv6 = undefined;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1500);
  void (async () => {
    try {
      const response = await fetch(IPV6_ENDPOINT, {
        signal: controller.signal,
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        cache: 'no-store',
      });
      if (!response.ok) return;
      const value = (await response.text()).trim().toLowerCase();
      if (value.length > 45 || !/^[23][0-9a-f]{3}:[0-9a-f:]+$/.test(value)) return;
      const normalized = new URL(`https://[${value}]/`).hostname.slice(1, -1);
      if (normalized.startsWith('2001:db8:')) return;
      clientIpv6 = normalized;
    } catch {
      // IPv4-only networks and blocked resolvers keep the server-observed IP.
      clientIpv6 = undefined;
    } finally {
      clearTimeout(timer);
    }
  })();
};

export const getClientIpv6 = (): string | undefined => {
  if (startedAt === undefined || Date.now() - startedAt >= MAX_AGE_MS) return undefined;
  return clientIpv6;
};
