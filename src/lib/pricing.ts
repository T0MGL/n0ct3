// NOCTE pricing engine. Single source of truth for unit price, bundle tiers and
// the wholesale threshold. Anything that quotes a price reads from here.

export const UNIT_PRICE = 229000;
export const ORIGINAL_UNIT_PRICE = 290000;
export const WHOLESALE_THRESHOLD = 6;

export interface PriceTier {
  qty: number;
  unitPrice: number;
  total: number;
  label: string;
  badge: string | null;
  highlighted: boolean;
  wholesale: boolean;
}

const RAW_TIERS: ReadonlyArray<Omit<PriceTier, "total" | "wholesale">> = [
  { qty: 1, unitPrice: 229000, label: "Personal", badge: null, highlighted: false },
  { qty: 2, unitPrice: 174500, label: "Pack Pareja", badge: "MÁS VENDIDO", highlighted: true },
  { qty: 3, unitPrice: 163000, label: "Pack Oficina", badge: "SUPER AHORRO", highlighted: false },
  { qty: 4, unitPrice: 163000, label: "Pack Familia", badge: null, highlighted: false },
  { qty: 5, unitPrice: 163000, label: "Pack Familia", badge: null, highlighted: false },
];

export const PRICE_TIERS: ReadonlyArray<PriceTier> = RAW_TIERS.map((t) => ({
  ...t,
  total: t.unitPrice * t.qty,
  wholesale: false,
}));

const WHOLESALE_TIER: PriceTier = {
  qty: WHOLESALE_THRESHOLD,
  unitPrice: 0,
  total: 0,
  label: "Pack Mayorista",
  badge: "PRECIO MAYORISTA",
  highlighted: false,
  wholesale: true,
};

// Returns the tier for a given quantity. Quantities above the wholesale threshold
// surface as a wholesale tier with zero price (price is coordinated by WhatsApp).
export function getPriceTier(qty: number): PriceTier {
  if (qty >= WHOLESALE_THRESHOLD) {
    return { ...WHOLESALE_TIER, qty };
  }
  const safeQty = Math.max(1, Math.min(qty, PRICE_TIERS.length));
  return PRICE_TIERS[safeQty - 1];
}

export function getEffectiveUnitPrice(qty: number): number {
  return getPriceTier(qty).unitPrice;
}

export function getBundleTotal(qty: number): number {
  const tier = getPriceTier(qty);
  return tier.wholesale ? 0 : tier.unitPrice * qty;
}

export function getBundleSavings(qty: number): number {
  const tier = getPriceTier(qty);
  if (tier.wholesale || qty <= 1) return 0;
  return (UNIT_PRICE - tier.unitPrice) * qty;
}

export const formatGuarani = (n: number): string => n.toLocaleString("es-PY");
