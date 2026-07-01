export type VariantId = "rojo" | "naranja" | "amarillo";

export type VariantMoment = "NOCHE" | "TARDE" | "DÍA";

export interface Variant {
  id: VariantId;
  name: string;
  /** Full product title used in order confirmations (WhatsApp, success screen). */
  productName: string;
  /** Colored circle that prefixes the variant in the WhatsApp order breakdown. */
  emoji: string;
  displayTitle: string;
  moment: VariantMoment;
  momentTimeWindow: string;
  blockedPercent: number;
  spectrumRange: readonly [number, number];
  spectrumLabel: string;
  accent: string;
  lensColor: string;
  lensGlow: string;
  tintFilter: string;
  tagline: string;
  use: string;
  description: string;
  benefits: readonly string[];
  /**
   * Manual out-of-stock flag. When true the color still renders but cannot be
   * selected or added to cart. This is a hand-set inventory gate, NOT read from
   * Ordefy. Flip back to false (or drop the field) when stock returns.
   */
  soldOut?: boolean;
}

// Source of truth for the three NOCTE lens variants. Single product, three tints.
// Anything that touches lens color, blocking spectrum, copy or accent reads from here.
export const VARIANTS: Readonly<Record<VariantId, Variant>> = {
  rojo: {
    id: "rojo",
    name: "NOCTE Rojo",
    productName: "NOCTE® Lentes Rojos",
    emoji: "🔴",
    displayTitle: "Lentes Rojos Anti-Luz Azul",
    moment: "NOCHE",
    momentTimeWindow: "20:00 a 03:00",
    blockedPercent: 99,
    spectrumRange: [400, 550],
    spectrumLabel: "400 a 550nm",
    accent: "#EF4444",
    lensColor: "#FF1A1A",
    lensGlow: "rgba(239,68,68,0.55)",
    tintFilter: "sepia(1) saturate(8) hue-rotate(-50deg) brightness(0.78)",
    tagline: "Sueño profundo. Modo noche.",
    use: "Para usar 2 a 3hs antes de dormir",
    description:
      "El bloqueo más agresivo. Si trabajás de noche con pantallas y querés dormir profundo, este es el tuyo.",
    benefits: [
      "Bloquea 99% de luz azul y verde",
      "Melatonina natural en 30 minutos",
      "Sueño REM profundo",
    ],
    soldOut: true,
  },
  naranja: {
    id: "naranja",
    name: "NOCTE Naranja",
    productName: "NOCTE® Lentes Naranjas",
    emoji: "🟠",
    displayTitle: "Lentes Naranjas Anti-Luz Azul",
    moment: "TARDE",
    momentTimeWindow: "17:00 a 20:00",
    blockedPercent: 95,
    spectrumRange: [400, 500],
    spectrumLabel: "400 a 500nm",
    accent: "#F97316",
    lensColor: "#FF7A1A",
    lensGlow: "rgba(255,122,26,0.55)",
    tintFilter: "sepia(1) saturate(5) hue-rotate(-25deg) brightness(0.92)",
    tagline: "Atardecer. Transición.",
    use: "Para las horas previas al rojo",
    description:
      "Bloqueo intermedio. Ideal para la transición tarde a noche cuando todavía necesitás distinguir colores con precisión.",
    benefits: [
      "Bloquea 95% de luz azul",
      "Sin distorsión cromática extrema",
      "Fatiga ocular reducida un 70%",
    ],
  },
  amarillo: {
    id: "amarillo",
    name: "NOCTE Amarillo",
    productName: "NOCTE® Lentes Amarillos",
    emoji: "🟡",
    displayTitle: "Lentes Amarillos Anti-Luz Azul",
    moment: "DÍA",
    momentTimeWindow: "08:00 a 17:00",
    blockedPercent: 75,
    spectrumRange: [400, 450],
    spectrumLabel: "400 a 450nm",
    accent: "#EAB308",
    lensColor: "#FFD11A",
    lensGlow: "rgba(255,209,26,0.45)",
    tintFilter: "sepia(0.8) saturate(2) hue-rotate(-8deg) brightness(1.02)",
    tagline: "Oficina. Día con pantallas.",
    use: "Para usar todo el día",
    description:
      "Para 8 horas o más frente a pantallas. Reduce fatiga sin alterar los colores. Trabajás todo el día sin migrañas.",
    benefits: [
      "Bloquea 75% de luz azul HEV",
      "Colores prácticamente naturales",
      "Cero fatiga al final del día",
    ],
  },
} as const;

export const VARIANT_IDS = ["rojo", "naranja", "amarillo"] as const satisfies readonly VariantId[];

export function isVariantId(value: string): value is VariantId {
  return value === "rojo" || value === "naranja" || value === "amarillo";
}

export function getVariant(id: VariantId): Variant {
  return VARIANTS[id];
}

/** True when a color is manually flagged out of stock and must not be sellable. */
export function isVariantSoldOut(id: VariantId): boolean {
  return VARIANTS[id].soldOut === true;
}

/**
 * First in-stock color in canonical order. Derived so the default follows the
 * soldOut flags: mark a color sold out and the default skips it automatically,
 * flip it back and the default returns without touching this file.
 */
export const DEFAULT_VARIANT: VariantId =
  VARIANT_IDS.find((id) => !isVariantSoldOut(id)) ?? VARIANT_IDS[0];

/**
 * Force any candidate id onto a sellable color. Sold-out picks (stale state,
 * deep links, resized packs) collapse to DEFAULT_VARIANT so a gated color can
 * never end up active or in the cart.
 */
export function resolveSelectableVariant(id: VariantId): VariantId {
  return isVariantSoldOut(id) ? DEFAULT_VARIANT : id;
}

export interface VariantCount {
  variant: Variant;
  count: number;
}

/**
 * Collapse a per-unit picks array (e.g. ["amarillo", "rojo"]) into one entry
 * per distinct variant with its quantity, ordered by the canonical variant
 * order so the breakdown is stable. Unknown ids are skipped defensively.
 */
export function summarizeVariantCounts(picks: readonly VariantId[]): VariantCount[] {
  const counts = picks.reduce<Partial<Record<VariantId, number>>>((acc, id) => {
    if (isVariantId(id)) acc[id] = (acc[id] ?? 0) + 1;
    return acc;
  }, {});

  return VARIANT_IDS.flatMap((id) => {
    const count = counts[id];
    return count ? [{ variant: VARIANTS[id], count }] : [];
  });
}
